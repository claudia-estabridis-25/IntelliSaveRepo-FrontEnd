import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CompanyService } from '../../services/company.service';
import { CompanyInsert } from '../../models/company';

@Component({
  selector: 'app-empresa-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './empresa-registrar.html',
  styleUrl: './empresa-registrar.css'
})
export class EmpresaRegistrar implements OnInit {
  form: FormGroup;
  idEmpresa: number | null = null;
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService
  ) {
    this.form = this.fb.group({
      rucCompany: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      formalNameCompany: ['', [Validators.required, Validators.maxLength(40)]],
      comercialNamecompany: ['', [Validators.required, Validators.maxLength(40)]],
      sectorCompany: ['', [Validators.required, Validators.maxLength(20)]],
      addressCompany: ['', [Validators.required, Validators.maxLength(60)]],
      phoneNumberCompany: ['', [Validators.required, Validators.pattern(/^[0-9]{7,9}$/)]],
      emailCompany: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      nameOwnerCompany: ['', [Validators.required, Validators.maxLength(16)]],
      surnameOwnerCompany: ['', [Validators.required, Validators.maxLength(20)]],
      descriptionCompany: ['', [Validators.required, Validators.maxLength(90)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEmpresa = Number(id);
      this.cargar(this.idEmpresa);
    }
  }

  get esEdicion(): boolean {
    return this.idEmpresa !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.companyService.listarPorId(id).subscribe({
      next: empresa => {
        this.form.patchValue(empresa);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta empresa.' : 'No se encontró la empresa.');
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

    const empresa: CompanyInsert = { ...this.form.value, idCompany: this.idEmpresa ?? 0 };
    const peticion = this.esEdicion
      ? this.companyService.modificar(empresa)
      : this.companyService.registrar(empresa);

    peticion.subscribe({
      next: guardada => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/empresas'], { state: { mensaje: `Se ${accion} la empresa ${guardada.comercialNamecompany}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para guardar esta empresa.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar la empresa.');
        }
      }
    });
  }
}
