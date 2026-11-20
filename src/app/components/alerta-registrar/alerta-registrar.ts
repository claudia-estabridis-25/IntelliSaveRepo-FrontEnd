import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from '../../services/alert.service';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { AlertInsert, ESTADOS_ALERTA, PRIORIDADES_ALERTA } from '../../models/alert';
import { Equipment } from '../../models/equipment';
import { Department } from '../../models/department';

@Component({
  selector: 'app-alerta-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './alerta-registrar.html',
  styleUrl: './alerta-registrar.css'
})
export class AlertaRegistrar implements OnInit {
  form: FormGroup;
  idAlerta: number | null = null;
  equipos = signal<Equipment[]>([]);
  areas = signal<Department[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  estados = ESTADOS_ALERTA;
  prioridades = PRIORIDADES_ALERTA;
  tipos = ['Consumo elevado', 'Falla de equipo', 'Mantenimiento', 'Uso fuera de horario'];

  grupos = computed(() =>
    this.areas()
      .map(area => ({
        area: area.nameDepartment,
        equipos: this.equipos().filter(equipo => equipo.idDepartment === area.idDepartment)
      }))
      .filter(grupo => grupo.equipos.length > 0)
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService
  ) {
    this.form = this.fb.group({
      idEquipment: [null, Validators.required],
      typeAlert: ['', [Validators.required, Validators.maxLength(20)]],
      priorityLevelAlert: ['Media', Validators.required],
      kwhDetected: [null, [Validators.required, Validators.min(0)]],
      dateTimeAlert: [''],
      statusAlert: ['Pendiente', Validators.required],
      descriptionAlert: ['', [Validators.required, Validators.maxLength(90)]]
    });
  }

  ngOnInit(): void {
    this.equipmentService.listar().subscribe({
      next: datos => this.equipos.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de equipos.')
    });
    this.departmentService.listar().subscribe({ next: datos => this.areas.set(datos) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idAlerta = Number(id);
      this.cargar(this.idAlerta);
    }
  }

  get esEdicion(): boolean {
    return this.idAlerta !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.alertService.listarPorId(id).subscribe({
      next: alerta => {
        this.form.patchValue({ ...alerta, dateTimeAlert: alerta.dateTimeAlert.slice(0, 16) });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta alerta.' : 'No se encontró la alerta.');
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
    const alerta: AlertInsert = {
      ...valores,
      idAlert: this.idAlerta,
      dateTimeAlert: valores.dateTimeAlert ? valores.dateTimeAlert : null
    };
    const peticion = this.esEdicion
      ? this.alertService.modificar(alerta)
      : this.alertService.registrar(alerta);

    peticion.subscribe({
      next: guardada => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/alertas'], { state: { mensaje: `Se ${accion} la alerta de ${guardada.nameEquipment}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para guardar alertas de ese equipo.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar la alerta.');
        }
      }
    });
  }
}
