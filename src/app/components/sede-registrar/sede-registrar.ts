import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { BranchInsert } from '../../models/branch';
import { Company } from '../../models/company';

function coordenadasValidas(grupo: AbstractControl): ValidationErrors | null {
  const latitud = grupo.get('latitudeBranch')?.value;
  const longitud = grupo.get('longitudeBranch')?.value;
  return latitud === 0 && longitud === 0 ? { coordenadasCero: true } : null;
}

@Component({
  selector: 'app-sede-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './sede-registrar.html',
  styleUrl: './sede-registrar.css'
})
export class SedeRegistrar implements OnInit {
  form: FormGroup;
  idSede: number | null = null;
  empresas = signal<Company[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService,
    private companyService: CompanyService
  ) {
    this.form = this.fb.group({
      nameBranch: ['', [Validators.required, Validators.maxLength(30)]],
      idCompany: [null, Validators.required],
      addressBranch: ['', [Validators.required, Validators.maxLength(60)]],
      latitudeBranch: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitudeBranch: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      descriptionBranch: ['', [Validators.required, Validators.maxLength(90)]]
    }, { validators: coordenadasValidas });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idSede = Number(id);
      this.cargar(this.idSede);
    }

    this.companyService.listar().subscribe({
      next: datos => {
        this.empresas.set(datos);
        if (datos.length === 1 && !this.esEdicion) {
          this.form.patchValue({ idCompany: datos[0].idCompany });
        }
      },
      error: () => this.error.set('No se pudo cargar la lista de empresas.')
    });
  }

  get esEdicion(): boolean {
    return this.idSede !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.branchService.listarPorId(id).subscribe({
      next: sede => {
        this.form.patchValue(sede);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta sede.' : 'No se encontró la sede.');
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

    const sede: BranchInsert = { ...this.form.value, idBranch: this.idSede ?? 0 };
    const peticion = this.esEdicion
      ? this.branchService.modificar(sede)
      : this.branchService.registrar(sede);

    peticion.subscribe({
      next: guardada => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/sedes'], { state: { mensaje: `Se ${accion} la sede ${guardada.nameBranch}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para guardar sedes en esa empresa.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar la sede.');
        }
      }
    });
  }
}
