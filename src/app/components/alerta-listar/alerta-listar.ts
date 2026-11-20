import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AlertService } from '../../services/alert.service';
import { LoginService } from '../../services/login.service';
import { Alert, ESTADOS_ALERTA, PRIORIDADES_ALERTA } from '../../models/alert';

@Component({
  selector: 'app-alerta-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './alerta-listar.html',
  styleUrl: './alerta-listar.css'
})
export class AlertaListar implements OnInit {
  alertas = signal<Alert[]>([]);
  estado = signal('');
  prioridad = signal('');
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  puedeGestionar = false;
  esAdmin = false;
  estados = ESTADOS_ALERTA;
  prioridades = PRIORIDADES_ALERTA;
  columnas = ['fecha', 'equipo', 'alerta', 'prioridad', 'kwh', 'estado', 'acciones'];

  filtradas = computed(() =>
    this.alertas().filter(alerta =>
      (!this.estado() || alerta.statusAlert === this.estado()) &&
      (!this.prioridad() || alerta.priorityLevelAlert === this.prioridad())
    )
  );

  pendientes = computed(() => this.alertas().filter(alerta => alerta.statusAlert === 'Pendiente').length);

  constructor(private alertService: AlertService, private loginService: LoginService) {}

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
        this.error.set('No se pudo cargar la lista de alertas.');
        this.cargando.set(false);
      }
    });
  }

  colorPrioridad(prioridad: string): string {
    return prioridad === 'Alta' ? 'rojo' : prioridad === 'Media' ? 'ambar' : '';
  }

  cambiarEstado(alerta: Alert, estado: string): void {
    this.mensaje.set('');
    this.error.set('');
    this.alertService.cambiarEstado(alerta.idAlert, estado).subscribe({
      next: actualizada => {
        this.alertas.update(lista => lista.map(a => a.idAlert === actualizada.idAlert ? actualizada : a));
        this.mensaje.set(`La alerta de ${alerta.nameEquipment} ahora está "${estado}".`);
      },
      error: (err: HttpErrorResponse) => {
        this.alertas.update(lista => lista.map(a => ({ ...a })));
        this.error.set(err.error?.message ?? 'No se pudo cambiar el estado de la alerta.');
      }
    });
  }

  eliminar(alerta: Alert): void {
    if (!confirm(`¿Eliminar la alerta "${alerta.typeAlert}" de ${alerta.nameEquipment}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.alertService.eliminar(alerta.idAlert).subscribe({
      next: () => {
        this.alertas.update(lista => lista.filter(a => a.idAlert !== alerta.idAlert));
        this.mensaje.set('Se eliminó la alerta.');
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso para eliminar esta alerta.' : 'No se pudo eliminar la alerta.');
      }
    });
  }
}
