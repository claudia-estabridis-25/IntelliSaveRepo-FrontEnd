import { Component, OnInit, Signal, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { PredictionService } from '../../services/prediction.service';
import { DepartmentService } from '../../services/department.service';
import { EquipmentService } from '../../services/equipment.service';
import { BranchService } from '../../services/branch.service';
import { PredictionRequest } from '../../models/prediction';
import { Department } from '../../models/department';
import { Equipment } from '../../models/equipment';
import { Branch } from '../../models/branch';

function rangoValido(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('initialDatePrediction')?.value;
  const fin = grupo.get('endDatePrediction')?.value;
  if (!inicio || !fin) {
    return null;
  }
  if (fin < inicio) {
    return { rangoInvalido: true };
  }
  const dias = (new Date(fin).getTime() - new Date(inicio).getTime()) / 86400000;
  return dias > 90 ? { rangoLargo: true } : null;
}

@Component({
  selector: 'app-prediccion-generar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './prediccion-generar.html',
  styleUrl: './prediccion-generar.css'
})
export class PrediccionGenerar implements OnInit {
  form: FormGroup;
  areas = signal<Department[]>([]);
  equipos = signal<Equipment[]>([]);
  sedes = signal<Branch[]>([]);
  guardando = signal(false);
  error = signal('');
  idAreaElegida: Signal<number | null>;

  grupos = computed(() =>
    this.sedes()
      .map(sede => ({
        sede: sede.nameBranch,
        areas: this.areas().filter(area => area.idBranch === sede.idBranch)
      }))
      .filter(grupo => grupo.areas.length > 0)
  );

  equiposDelArea = computed(() =>
    this.equipos().filter(equipo => equipo.idDepartment === this.idAreaElegida())
  );

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private predictionService: PredictionService,
    private departmentService: DepartmentService,
    private equipmentService: EquipmentService,
    private branchService: BranchService
  ) {
    this.form = this.fb.group({
      idDepartment: [null, Validators.required],
      idEquipment: [null],
      initialDatePrediction: ['', Validators.required],
      endDatePrediction: ['', Validators.required]
    }, { validators: rangoValido });
    this.idAreaElegida = toSignal(this.form.get('idDepartment')!.valueChanges, { initialValue: null });
    this.form.get('idDepartment')!.valueChanges.subscribe(() => this.form.patchValue({ idEquipment: null }, { emitEvent: false }));
  }

  ngOnInit(): void {
    this.departmentService.listar().subscribe({
      next: datos => this.areas.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de áreas.')
    });
    this.equipmentService.listar().subscribe({ next: datos => this.equipos.set(datos) });
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
  }

  generar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const solicitud: PredictionRequest = this.form.value;
    this.predictionService.generar(solicitud).subscribe({
      next: resultado => {
        const prediccion = resultado.prediction;
        this.router.navigate(['/predicciones'], {
          state: {
            mensaje: `Predicción generada: ${prediccion.kwhPrediction.toFixed(2)} kWh (S/ ${prediccion.costPrediction.toFixed(2)}) con ${resultado.historicalDaysWithData} días de historial.`
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para generar predicciones de esa área.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo generar la predicción.');
        }
      }
    });
  }
}
