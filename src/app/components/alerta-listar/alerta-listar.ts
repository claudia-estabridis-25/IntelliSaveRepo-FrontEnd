import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { AlertService } from '../../services/alert.service';
import { DepartmentService } from '../../services/department.service';
import { LoginService } from '../../services/login.service';
import { Alert, ESTADOS_ALERTA, PRIORIDADES_ALERTA } from '../../models/alert';
import { Department } from '../../models/department';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { AlertaEstadisticas } from '../alerta-estadisticas/alerta-estadisticas';

// Estados que siguen en el listado principal; "Atendida" y "Descartada" pasan al historial (HU144 CA02).
const ESTADOS_ABIERTOS = ['Pendiente', 'En revisión'];
const ESTADOS_CERRADOS = ['Atendida', 'Descartada'];

// Tipos que genera el sistema (HU145) y los sugeridos al registrar una alerta manual.
const TIPOS_ALERTA = ['Consumo excesivo', 'Pico anormal', 'Consumo elevado', 'Falla de equipo', 'Mantenimiento', 'Uso fuera de horario'];

@Component({
  selector: 'app-alerta-listar',
  imports: [
    MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatTabsModule,
    RouterLink, DatePipe, DecimalPipe, NgTemplateOutlet, TraducirPipe, AlertaEstadisticas],
  templateUrl: './alerta-listar.html',
  styleUrl: './alerta-listar.css'
})
export class AlertaListar implements OnInit {
  // Listado principal (alertas abiertas)
  alertas = signal<Alert[]>([]);
  estado = signal('');
  prioridad = signal('');
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  puedeGestionar = false;
  esAdmin = false;
  estados = ESTADOS_ALERTA;
  estadosAbiertos = ESTADOS_ABIERTOS;
  prioridades = PRIORIDADES_ALERTA;
  columnas = ['fecha', 'equipo', 'alerta', 'prioridad', 'kwh', 'estado', 'acciones'];

  // Historial de alertas atendidas o descartadas (HU142 CA02)
  historial = signal<Alert[]>([]);
  tipoHistorial = signal('');
  desdeHistorial = signal('');
  hastaHistorial = signal('');
  cargandoHistorial = signal(false);
  historialCargado = false;
  tiposVistos = signal<string[]>([]);
  columnasHistorial = ['fecha', 'equipo', 'alerta', 'prioridad', 'kwh', 'cierre'];

  // Generación de alertas por área (HU145)
  areas = signal<Department[]>([]);
  idArea = signal(0);
  desdeGenerar = signal('');
  hastaGenerar = signal('');
  generando = signal(false);
  generadas = signal<Alert[] | null>(null);
  areaGenerada = signal('');
  columnasGeneradas = ['fecha', 'equipo', 'alerta', 'prioridad', 'kwh'];

  abiertas = computed(() => this.alertas().filter(alerta => ESTADOS_ABIERTOS.includes(alerta.statusAlert)));

  filtradas = computed(() =>
    this.abiertas().filter(alerta =>
      (!this.estado() || alerta.statusAlert === this.estado()) &&
      (!this.prioridad() || alerta.priorityLevelAlert === this.prioridad())
    )
  );

  pendientes = computed(() => this.abiertas().filter(alerta => alerta.statusAlert === 'Pendiente').length);

  tipos = computed(() => {
    const todos = new Set([...TIPOS_ALERTA, ...this.tiposVistos(), ...this.alertas().map(alerta => alerta.typeAlert)]);
    return [...todos].sort((a, b) => a.localeCompare(b));
  });

  areasOrdenadas = computed(() => [...this.areas()].sort((a, b) => a.nameDepartment.localeCompare(b.nameDepartment)));

  constructor(
    private alertService: AlertService,
    private departmentService: DepartmentService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.puedeGestionar = this.esAdmin || this.loginService.tieneRol('SUPERVISOR');
    this.alertService.listar().subscribe({
      next: datos => {
        this.alertas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de alertas.'));
        this.cargando.set(false);
      }
    });
    if (this.puedeGestionar) {
      this.departmentService.listar().subscribe({
        next: datos => this.areas.set(datos)
      });
    }
  }

  cambiarPestana(indice: number): void {
    this.mensaje.set('');
    this.error.set('');
    if (indice === 1 && !this.historialCargado) {
      this.consultarHistorial();
    }
  }

  colorPrioridad(prioridad: string): string {
    return prioridad === 'Alta' ? 'rojo' : prioridad === 'Media' ? 'ambar' : '';
  }

  colorEstado(estado: string): string {
    return estado === 'Atendida' ? 'verde' : '';
  }

  cambiarEstado(alerta: Alert, estado: string): void {
    this.mensaje.set('');
    this.error.set('');
    this.alertService.cambiarEstado(alerta.idAlert, estado).subscribe({
      next: actualizada => {
        this.alertas.update(lista => lista.map(a => a.idAlert === actualizada.idAlert ? actualizada : a));
        if (ESTADOS_CERRADOS.includes(estado)) {
          this.historialCargado = false;
          this.mensaje.set(this.idiomaService.t('La alerta de {0} quedó "{1}" y pasó al historial.', [alerta.nameEquipment, this.idiomaService.t(estado)]));
        } else {
          this.mensaje.set(this.idiomaService.t('La alerta de {0} ahora está "{1}".', [alerta.nameEquipment, this.idiomaService.t(estado)]));
        }
      },
      error: (err: HttpErrorResponse) => {
        this.alertas.update(lista => lista.map(a => ({ ...a })));
        this.error.set(err.error?.message ?? this.idiomaService.t('No se pudo cambiar el estado de la alerta.'));
      }
    });
  }

  eliminar(alerta: Alert): void {
    if (!confirm(this.idiomaService.t('¿Eliminar la alerta "{0}" de {1}?', [this.idiomaService.t(alerta.typeAlert), alerta.nameEquipment]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.alertService.eliminar(alerta.idAlert).subscribe({
      next: () => {
        this.alertas.update(lista => lista.filter(a => a.idAlert !== alerta.idAlert));
        this.mensaje.set(this.idiomaService.t('Se eliminó la alerta.'));
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.idiomaService.t(err.status === 403 ? 'No tienes acceso para eliminar esta alerta.' : 'No se pudo eliminar la alerta.'));
      }
    });
  }

  consultarHistorial(): void {
    this.mensaje.set('');
    this.error.set('');
    if (this.rangoInvalido(this.desdeHistorial(), this.hastaHistorial())) {
      this.error.set(this.idiomaService.t('La fecha de inicio no puede ser posterior a la fecha de fin.'));
      return;
    }
    this.cargandoHistorial.set(true);
    this.alertService.historial(
      this.tipoHistorial() || null,
      this.inicioDelDia(this.desdeHistorial()),
      this.finDelDia(this.hastaHistorial())
    ).subscribe({
      next: datos => {
        this.historial.set(datos);
        this.tiposVistos.update(vistos => [...new Set([...vistos, ...datos.map(alerta => alerta.typeAlert)])]);
        this.historialCargado = true;
        this.cargandoHistorial.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.historial.set([]);
        this.error.set(this.mensajeError(err, this.idiomaService.t('No se pudo cargar el historial de alertas.')));
        this.cargandoHistorial.set(false);
      }
    });
  }

  limpiarHistorial(): void {
    this.tipoHistorial.set('');
    this.desdeHistorial.set('');
    this.hastaHistorial.set('');
    this.consultarHistorial();
  }

  hayFiltrosHistorial(): boolean {
    return !!(this.tipoHistorial() || this.desdeHistorial() || this.hastaHistorial());
  }

  generar(): void {
    this.mensaje.set('');
    this.error.set('');
    const area = this.areas().find(a => a.idDepartment === this.idArea());
    if (!area) {
      this.error.set(this.idiomaService.t('Elige el área que quieres analizar.'));
      return;
    }
    if (this.rangoInvalido(this.desdeGenerar(), this.hastaGenerar())) {
      this.error.set(this.idiomaService.t('La fecha de inicio no puede ser posterior a la fecha de fin.'));
      return;
    }
    this.generando.set(true);
    this.generadas.set(null);
    this.alertService.generarDeArea(
      area.idDepartment,
      this.inicioDelDia(this.desdeGenerar()),
      this.finDelDia(this.hastaGenerar())
    ).subscribe({
      next: datos => {
        this.areaGenerada.set(area.nameDepartment);
        this.generadas.set(datos);
        if (datos.length > 0) {
          this.alertas.update(lista => [...datos, ...lista]);
        }
        this.generando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeError(err, this.idiomaService.t('No se pudieron generar las alertas del área.')));
        this.generando.set(false);
      }
    });
  }

  private rangoInvalido(desde: string, hasta: string): boolean {
    return !!desde && !!hasta && desde > hasta;
  }

  private inicioDelDia(fecha: string): string | null {
    return fecha ? `${fecha}T00:00:00` : null;
  }

  private finDelDia(fecha: string): string | null {
    return fecha ? `${fecha}T23:59:59` : null;
  }

  private mensajeError(err: HttpErrorResponse, porDefecto: string): string {
    if (err.status === 403) {
      return this.idiomaService.t('No tienes acceso a esta opción.');
    }
    return err.status === 400 || err.status === 404 ? err.error?.message ?? porDefecto : porDefecto;
  }
}
