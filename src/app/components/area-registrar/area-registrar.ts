import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { Company } from '../../models/company';

@Component({
  selector: 'app-area-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './area-registrar.html',
  styleUrl: './area-registrar.css'
})
export class AreaRegistrar implements OnInit {
  form: FormGroup;
  idArea: number | null = null;
  sedes = signal<Branch[]>([]);
  empresas = signal<Company[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');

  grupos = computed(() =>
    this.empresas()
      .map(empresa => ({
        empresa: empresa.comercialNamecompany,
        sedes: this.sedes().filter(sede => sede.idCompany === empresa.idCompany)
      }))
      .filter(grupo => grupo.sedes.length > 0)
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private companyService: CompanyService
  ) {
    this.form = this.fb.group({
      nameDepartment: ['', [Validators.required, Validators.maxLength(30)]],
      nameBoss: ['', [Validators.required, Validators.maxLength(40)]],
      idBranch: [null, Validators.required],
      descriptionDepartment: ['', [Validators.required, Validators.maxLength(90)]]
    });
  }

  ngOnInit(): void {
    this.branchService.listar().subscribe({
      next: datos => this.sedes.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de sedes.')
    });
    this.companyService.listar().subscribe({
      next: datos => this.empresas.set(datos)
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idArea = Number(id);
      this.cargar(this.idArea);
    }
  }

  get esEdicion(): boolean {
    return this.idArea !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.departmentService.listarPorId(id).subscribe({
      next: area => {
        this.form.patchValue(area);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta área.' : 'No se encontró el área.');
        this.cargando.set(false);
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const area: Department = { ...this.form.value, idDepartment: this.idArea ?? 0 };
    const peticion = this.esEdicion
      ? this.departmentService.modificar(area)
      : this.departmentService.registrar(area);

    peticion.subscribe({
      next: guardada => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/areas'], { state: { mensaje: `Se ${accion} el área ${guardada.nameDepartment}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para registrar áreas en esa sede.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar el área.');
        }
      }
    });
  }
}
