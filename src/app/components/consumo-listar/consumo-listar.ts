import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConsumptionRecordService } from '../../services/consumption-record.service';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { LoginService } from '../../services/login.service';
import { ConsumptionRecord } from '../../models/consumption-record';
import { Equipment } from '../../models/equipment';

@Component({
  selector: 'app-consumo-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './consumo-listar.html',
  styleUrl: './consumo-listar.css'
})
export class ConsumoListar implements OnInit {
  registros = signal<ConsumptionRecord[]>([]);
  equipos = signal<Map<number, Equipment>>(new Map());
  areas = signal<Map<number, string>>(new Map());
  idEquipo = signal(0);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  puedeGestionar = false;
  esAdmin = false;
  columnas = ['fecha', 'equipo', 'horas', 'kwh', 'costo', 'observacion', 'acciones'];

  listaEquipos = computed(() => [...this.equipos().values()].sort((a, b) => a.nameEquipment.localeCompare(b.nameEquipment)));

  filtrados = computed(() =>
    this.registros()
      .filter(registro => this.idEquipo() === 0 || registro.idEquipment === this.idEquipo())
      .sort((a, b) => b.dateTimeRecord.localeCompare(a.dateTimeRecord))
  );

  totalKwh = computed(() => this.filtrados().reduce((suma, registro) => suma + registro.kwhConsumption, 0));
  totalCosto = computed(() => this.filtrados().reduce((suma, registro) => suma + registro.costTotal, 0));

  constructor(
    private consumptionRecordService: ConsumptionRecordService,
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private loginService: LoginService
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
        next: datos => this.areas.set(new Map(datos.map(area => [area.idDepartment, area.nameDepartment])))
      });
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.consumptionRecordService.listar().subscribe({
      next: datos => {
        this.registros.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de consumos.');
        this.cargando.set(false);
      }
    });
  }

  nombreEquipo(idEquipment: number): string {
    return this.equipos().get(idEquipment)?.nameEquipment ?? `Equipo ${idEquipment}`;
  }

  nombreArea(idEquipment: number): string {
    const equipo = this.equipos().get(idEquipment);
    return equipo ? this.areas().get(equipo.idDepartment) ?? '' : '';
  }

  eliminar(registro: ConsumptionRecord): void {
    if (!confirm(`¿Eliminar el consumo de ${this.nombreEquipo(registro.idEquipment)}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.consumptionRecordService.eliminar(registro.idConsumptionRecord).subscribe({
      next: () => {
        this.registros.update(lista => lista.filter(r => r.idConsumptionRecord !== registro.idConsumptionRecord));
        this.mensaje.set('Se eliminó el registro de consumo.');
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso para eliminar este consumo.' : 'No se pudo eliminar el consumo.');
      }
    });
  }
}
