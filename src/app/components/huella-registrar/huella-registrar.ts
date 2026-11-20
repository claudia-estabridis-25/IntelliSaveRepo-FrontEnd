import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CarbonFootprintService } from '../../services/carbon-footprint.service';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { CarbonFootprintInsert, PERIODOS_HUELLA } from '../../models/carbon-footprint';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';

@Component({
  selector: 'app-huella-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './huella-registrar.html',
  styleUrl: './huella-registrar.css'
})
export class HuellaRegistrar implements OnInit {
  form: FormGroup;
  idHuella: number | null = null;
  areas = signal<Department[]>([]);
  sedes = signal<Branch[]>([]);
  todas = signal(false);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  periodos = PERIODOS_HUELLA;
  hoy = new Date().toISOString().slice(0, 10);

  grupos = computed(() =>
    this.sedes()
      .map(sede => ({
        sede: sede.nameBranch,
        areas: this.areas().filter(area => area.idBranch === sede.idBranch)
      }))
      .filter(grupo => grupo.areas.length > 0)
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private carbonFootprintService: CarbonFootprintService,
    private departmentService: DepartmentService,
    private branchService: BranchService
  ) {
    this.form = this.fb.group({
      idDepartment: [null, Validators.required],
      timePeriod: ['Mensual', Validators.required],
      calculationDate: [''],
      emissionFactor: [null, [Validators.required, Validators.min(0.0001)]]
    });
  }

  ngOnInit(): void {
    this.departmentService.listar().subscribe({
      next: datos => this.areas.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de áreas.')
    });
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idHuella = Number(id);
      this.cargar(this.idHuella);
    }
  }

  get esEdicion(): boolean {
    return this.idHuella !== null;
  }

  elegirAlcance(todas: boolean): void {
    this.todas.set(todas);
    const area = this.form.get('idDepartment');
    area?.setValidators(todas ? null : Validators.required);
    area?.updateValueAndValidity();
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.carbonFootprintService.listarPorId(id).subscribe({
      next: huella => {
        this.form.patchValue(huella);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta huella.' : 'No se encontró la huella.');
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const valores = this.form.value;
    const fecha = valores.calculationDate ? valores.calculationDate : null;

    if (this.todas()) {
      this.carbonFootprintService.calcularTodas(valores.timePeriod, valores.emissionFactor, fecha).subscribe({
        next: lista => this.router.navigate(['/huella'], {
          state: { mensaje: `Se calculó la huella ${valores.timePeriod.toLowerCase()} de ${lista.length} áreas.` }
        }),
        error: (err: HttpErrorResponse) => this.mostrarError(err)
      });
      return;
    }

    const huella: CarbonFootprintInsert = { ...valores, idFootprint: this.idHuella, calculationDate: fecha };
    const peticion = this.esEdicion
      ? this.carbonFootprintService.modificar(huella)
      : this.carbonFootprintService.registrar(huella);

    peticion.subscribe({
      next: guardada => {
        this.router.navigate(['/huella'], {
          state: { mensaje: `Huella de ${guardada.nameDepartment}: ${guardada.co2Emissions.toFixed(2)} kg CO₂ (${guardada.kwhTotalConsumption.toFixed(2)} kWh).` }
        });
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err)
    });
  }

  private mostrarError(err: HttpErrorResponse): void {
    this.guardando.set(false);
    if (err.status === 403) {
      this.error.set('No tienes acceso para calcular la huella de esa área.');
    } else if (err.status === 400 || err.status === 404) {
      this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
    } else {
      this.error.set('No se pudo calcular la huella de carbono.');
    }
  }
}
