import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TariffService } from '../../services/tariff.service';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { TariffInsert } from '../../models/tariff';
import { Branch } from '../../models/branch';
import { Company } from '../../models/company';

function rangoValido(grupo: AbstractControl): ValidationErrors | null {
  const inicio = grupo.get('initialEffectiveDate')?.value;
  const fin = grupo.get('endEffectiveDate')?.value;
  return inicio && fin && fin < inicio ? { rangoInvalido: true } : null;
}

@Component({
  selector: 'app-tarifa-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './tarifa-registrar.html',
  styleUrl: './tarifa-registrar.css'
})
export class TarifaRegistrar implements OnInit {
  form: FormGroup;
  idTarifa: number | null = null;
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
    private tariffService: TariffService,
    private branchService: BranchService,
    private companyService: CompanyService
  ) {
    this.form = this.fb.group({
      idBranch: [null, Validators.required],
      supplier: ['', Validators.maxLength(60)],
      initialEffectiveDate: ['', Validators.required],
      endEffectiveDate: ['', Validators.required],
      costPerKwh: [null, [Validators.required, Validators.min(0.0001)]]
    }, { validators: rangoValido });
  }

  ngOnInit(): void {
    this.branchService.listar().subscribe({
      next: datos => this.sedes.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de sedes.')
    });
    this.companyService.listar().subscribe({ next: datos => this.empresas.set(datos) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idTarifa = Number(id);
      this.cargar(this.idTarifa);
    }
  }

  get esEdicion(): boolean {
    return this.idTarifa !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.tariffService.listarPorId(id).subscribe({
      next: tarifa => {
        this.form.patchValue({ ...tarifa, supplier: tarifa.supplier ?? '' });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta tarifa.' : 'No se encontró la tarifa.');
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
    const tarifa: TariffInsert = {
      ...valores,
      idTariff: this.idTarifa,
      supplier: valores.supplier?.trim() ? valores.supplier.trim() : null
    };
    const peticion = this.esEdicion
      ? this.tariffService.modificar(tarifa)
      : this.tariffService.registrar(tarifa);

    peticion.subscribe({
      next: guardada => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/tarifas'], { state: { mensaje: `Se ${accion} la tarifa de ${guardada.nameBranch}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para guardar tarifas en esa sede.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar la tarifa.');
        }
      }
    });
  }
}
