import { Component, OnInit, Signal, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ConsumptionRecordService } from '../../services/consumption-record.service';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { TariffService } from '../../services/tariff.service';
import { LoginService } from '../../services/login.service';
import { ConsumptionRecordInsert } from '../../models/consumption-record';
import { Equipment } from '../../models/equipment';
import { Department } from '../../models/department';
import { Tariff } from '../../models/tariff';

function ahoraLocal(): string {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
}

@Component({
  selector: 'app-consumo-registrar',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './consumo-registrar.html',
  styleUrl: './consumo-registrar.css'
})
export class ConsumoRegistrar implements OnInit {
  form: FormGroup;
  idRegistro: number | null = null;
  equipos = signal<Equipment[]>([]);
  areas = signal<Department[]>([]);
  tarifas = signal<Tariff[]>([]);
  idEquipoOriginal = signal<number | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  puedeGestionar = false;
  maximo = ahoraLocal();

  idEquipoElegido: Signal<number | null>;

  grupos = computed(() => {
    const disponibles = this.equipos().filter(equipo =>
      equipo.statusEquipment === 'Activo' || equipo.idEquipment === this.idEquipoOriginal()
    );
    if (this.areas().length === 0) {
      return disponibles.length > 0 ? [{ area: 'Equipos', equipos: disponibles }] : [];
    }
    return this.areas()
      .map(area => ({
        area: area.nameDepartment,
        equipos: disponibles.filter(equipo => equipo.idDepartment === area.idDepartment)
      }))
      .filter(grupo => grupo.equipos.length > 0);
  });

  tarifasDelEquipo = computed(() => {
    const equipo = this.equipos().find(e => e.idEquipment === this.idEquipoElegido());
    const area = this.areas().find(a => a.idDepartment === equipo?.idDepartment);
    return area ? this.tarifas().filter(tarifa => tarifa.idBranch === area.idBranch) : [];
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consumptionRecordService: ConsumptionRecordService,
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private tariffService: TariffService,
    private loginService: LoginService
  ) {
    this.form = this.fb.group({
      idEquipment: [null, Validators.required],
      dateTimeRecord: [ahoraLocal(), Validators.required],
      hoursOfUse: [null, [Validators.required, Validators.min(0.01), Validators.max(24)]],
      idTariff: [null],
      observationRecord: ['', Validators.maxLength(90)]
    });
    this.idEquipoElegido = toSignal(this.form.get('idEquipment')!.valueChanges, { initialValue: null });
  }

  ngOnInit(): void {
    this.puedeGestionar = this.loginService.tieneRol('ADMIN') || this.loginService.tieneRol('SUPERVISOR');
    this.equipmentService.listar().subscribe({
      next: datos => this.equipos.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de equipos.')
    });
    if (this.puedeGestionar) {
      this.departmentService.listar().subscribe({ next: datos => this.areas.set(datos) });
      this.tariffService.listar().subscribe({ next: datos => this.tarifas.set(datos) });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idRegistro = Number(id);
      this.cargar(this.idRegistro);
    }
  }

  get esEdicion(): boolean {
    return this.idRegistro !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.consumptionRecordService.listarPorId(id).subscribe({
      next: registro => {
        this.idEquipoOriginal.set(registro.idEquipment);
        this.form.patchValue({ ...registro, dateTimeRecord: registro.dateTimeRecord.slice(0, 16) });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a este consumo.' : 'No se encontró el consumo.');
        this.cargando.set(false);
      }
    });
  }

  largo(campo: string): number {
    return this.form.get(campo)?.value?.length ?? 0;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const valores = this.form.value;
    const registro: ConsumptionRecordInsert = {
      ...valores,
      idConsumptionRecord: this.idRegistro,
      observationRecord: valores.observationRecord?.trim() ? valores.observationRecord.trim() : null
    };
    const peticion = this.esEdicion
      ? this.consumptionRecordService.modificar(registro)
      : this.consumptionRecordService.registrar(registro);

    peticion.subscribe({
      next: guardado => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/consumos'], {
          state: { mensaje: `Se ${accion} el consumo: ${guardado.kwhConsumption.toFixed(2)} kWh, S/ ${guardado.costTotal.toFixed(2)}.` }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para registrar consumos de ese equipo.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar el consumo.');
        }
      }
    });
  }
}
