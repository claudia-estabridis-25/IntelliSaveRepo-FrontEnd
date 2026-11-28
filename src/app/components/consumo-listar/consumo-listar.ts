import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ConsumptionRecordService } from '../../services/consumption-record.service';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { LoginService } from '../../services/login.service';
import { ConsumptionRecord } from '../../models/consumption-record';
import { Equipment } from '../../models/equipment';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Paginacion } from '../../utils/paginacion';

@Component({
  selector: 'app-consumo-listar',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule, RouterLink, DatePipe, DecimalPipe, TraducirPipe],
  templateUrl: './consumo-listar.html',
  styleUrl: './consumo-listar.css'
})
export class ConsumoListar implements OnInit {
  registros = signal<ConsumptionRecord[]>([]);
  equipos = signal<Map<number, Equipment>>(new Map());
  areas = signal<Map<number, Department>>(new Map());
  sedes = signal<Map<number, Branch>>(new Map());
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  puedeGestionar = false;
  esAdmin = false;
  columnas = ['fecha', 'equipo', 'horas', 'kwh', 'costo', 'observacion', 'acciones'];

  // Filtros. El empleado solo filtra por equipo en el navegador; admin y supervisor usan el historial (HU100).
  idSede = signal(0);
  idArea = signal(0);
  idEquipo = signal(0);
  desde = signal('');
  hasta = signal('');
  filtrosAplicados = signal(false);

  listaSedes = computed(() => [...this.sedes().values()].sort((a, b) => a.nameBranch.localeCompare(b.nameBranch)));

  // Selectores encadenados: sede -> área -> equipo
  listaAreas = computed(() =>
    [...this.areas().values()]
      .filter(area => this.idSede() === 0 || area.idBranch === this.idSede())
      .sort((a, b) => a.nameDepartment.localeCompare(b.nameDepartment))
  );

  listaEquipos = computed(() => {
    const idsAreas = new Set(this.listaAreas().map(area => area.idDepartment));
    return [...this.equipos().values()]
      .filter(equipo =>
        !this.puedeGestionar ||
        (this.idArea() !== 0 ? equipo.idDepartment === this.idArea() : this.idSede() === 0 || idsAreas.has(equipo.idDepartment))
      )
      .sort((a, b) => a.nameEquipment.localeCompare(b.nameEquipment));
  });

  filtrados = computed(() =>
    this.registros()
      .filter(registro => this.puedeGestionar || this.idEquipo() === 0 || registro.idEquipment === this.idEquipo())
      .sort((a, b) => b.dateTimeRecord.localeCompare(a.dateTimeRecord))
  );

  totalKwh = computed(() => this.filtrados().reduce((suma, registro) => suma + registro.kwhConsumption, 0));
  totalCosto = computed(() => this.filtrados().reduce((suma, registro) => suma + registro.costTotal, 0));

  paginacion = new Paginacion(() => this.filtrados());

  constructor(
    private consumptionRecordService: ConsumptionRecordService,
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.puedeGestionar = this.esAdmin || this.loginService.tieneRol('SUPERVISOR');
    this.cargar();
    this.equipmentService.listar().subscribe({
      next: datos => this.equipos.set(new Map(datos.map(equipo => [equipo.idEquipment, equipo])))
    });
    if (this.puedeGestionar) {
      this.departmentService.listar().subscribe({
        next: datos => this.areas.set(new Map(datos.map(area => [area.idDepartment, area])))
      });
      this.branchService.listar().subscribe({
        next: datos => this.sedes.set(new Map(datos.map(sede => [sede.idBranch, sede])))
      });
    }
  }

  cargar(): void {
    this.cargando.set(true);
    if (!this.puedeGestionar) {
      this.consumptionRecordService.listar().subscribe({
        next: datos => {
          this.registros.set(datos);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(this.idiomaService.t('No se pudo cargar la lista de consumos.'));
          this.cargando.set(false);
        }
      });
      return;
    }
    this.consultarHistorial();
  }

  cambiarSede(idSede: number): void {
    this.idSede.set(idSede);
    const area = this.areas().get(this.idArea());
    if (idSede !== 0 && area && area.idBranch !== idSede) {
      this.idArea.set(0);
    }
    this.ajustarEquipo();
  }

  cambiarArea(idArea: number): void {
    this.idArea.set(idArea);
    this.ajustarEquipo();
  }

  // Si el equipo elegido ya no pertenece a la sede o área seleccionada, se limpia
  private ajustarEquipo(): void {
    if (this.idEquipo() !== 0 && !this.listaEquipos().some(equipo => equipo.idEquipment === this.idEquipo())) {
      this.idEquipo.set(0);
    }
  }

  hayFiltros(): boolean {
    return this.idSede() !== 0 || this.idArea() !== 0 || this.idEquipo() !== 0 || !!this.desde() || !!this.hasta();
  }

  filtrar(): void {
    this.mensaje.set('');
    this.consultarHistorial();
  }

  limpiarFiltros(): void {
    this.idSede.set(0);
    this.idArea.set(0);
    this.idEquipo.set(0);
    this.desde.set('');
    this.hasta.set('');
    this.mensaje.set('');
    this.consultarHistorial();
  }

  // HU100: historial de consumos con filtros opcionales (sede, área, equipo y rango de fechas)
  private consultarHistorial(): void {
    this.error.set('');
    // HU100 CA02: la fecha de inicio no puede ser posterior a la de fin
    if (this.desde() && this.hasta() && this.desde() > this.hasta()) {
      this.error.set(this.idiomaService.t('La fecha de inicio no puede ser posterior a la fecha de fin.'));
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.consumptionRecordService.historial({
      idBranch: this.idSede() || null,
      idDepartment: this.idArea() || null,
      idEquipment: this.idEquipo() || null,
      desde: this.desde() ? `${this.desde()}T00:00:00` : null,
      hasta: this.hasta() ? `${this.hasta()}T23:59:59` : null
    }).subscribe({
      next: datos => {
        this.registros.set(datos);
        this.filtrosAplicados.set(this.hayFiltros());
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.registros.set([]);
        this.error.set(
          err.status === 400 || err.status === 404
            ? err.error?.message ?? this.idiomaService.t('Revisa los filtros elegidos.')
            : this.idiomaService.t(err.status === 403 ? 'No tienes acceso al historial de consumos.' : 'No se pudo cargar el historial de consumos.')
        );
        this.cargando.set(false);
      }
    });
  }

  nombreEquipo(idEquipment: number): string {
    return this.equipos().get(idEquipment)?.nameEquipment ?? this.idiomaService.t('Equipo {0}', [idEquipment]);
  }

  nombreArea(idEquipment: number): string {
    const equipo = this.equipos().get(idEquipment);
    return equipo ? this.areas().get(equipo.idDepartment)?.nameDepartment ?? '' : '';
  }

  nombreSede(idEquipment: number): string {
    const equipo = this.equipos().get(idEquipment);
    const area = equipo ? this.areas().get(equipo.idDepartment) : undefined;
    return area ? this.sedes().get(area.idBranch)?.nameBranch ?? '' : '';
  }

  eliminar(registro: ConsumptionRecord): void {
    if (!confirm(this.idiomaService.t('¿Eliminar el consumo de {0}?', [this.nombreEquipo(registro.idEquipment)]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.consumptionRecordService.eliminar(registro.idConsumptionRecord).subscribe({
      next: () => {
        this.registros.update(lista => lista.filter(r => r.idConsumptionRecord !== registro.idConsumptionRecord));
        this.mensaje.set(this.idiomaService.t('Se eliminó el registro de consumo.'));
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.idiomaService.t(err.status === 403 ? 'No tienes acceso para eliminar este consumo.' : 'No se pudo eliminar el consumo.'));
      }
    });
  }
}
