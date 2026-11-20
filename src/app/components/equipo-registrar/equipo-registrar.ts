import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { EquipmentInsert } from '../../models/equipment';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';

@Component({
  selector: 'app-equipo-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './equipo-registrar.html',
  styleUrl: './equipo-registrar.css'
})
export class EquipoRegistrar implements OnInit {
  form: FormGroup;
  idEquipo: number | null = null;
  areas = signal<Department[]>([]);
  sedes = signal<Branch[]>([]);
  categorias = signal<string[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
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
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private branchService: BranchService
  ) {
    this.form = this.fb.group({
      nameEquipment: ['', [Validators.required, Validators.maxLength(40)]],
      categoryEquipment: ['', [Validators.required, Validators.maxLength(40)]],
      brandEquipment: ['', [Validators.required, Validators.maxLength(30)]],
      modelEquipment: ['', [Validators.required, Validators.maxLength(30)]],
      wattPowerEquipment: [null, [Validators.required, Validators.min(0.1)]],
      acquisitionDateEquipment: ['', Validators.required],
      statusEquipment: ['Activo', Validators.required],
      idDepartment: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.departmentService.listar().subscribe({
      next: datos => this.areas.set(datos),
      error: () => this.error.set('No se pudo cargar la lista de áreas.')
    });
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
    this.equipmentService.listar().subscribe({
      next: datos => this.categorias.set([...new Set(datos.map(equipo => equipo.categoryEquipment))].sort())
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEquipo = Number(id);
      this.cargar(this.idEquipo);
    }
  }

  get esEdicion(): boolean {
    return this.idEquipo !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.equipmentService.listarPorId(id).subscribe({
      next: equipo => {
        this.form.patchValue(equipo);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a este equipo.' : 'No se encontró el equipo.');
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

    const equipo: EquipmentInsert = { ...this.form.value, idEquipment: this.idEquipo ?? 0 };
    const peticion = this.esEdicion
      ? this.equipmentService.modificar(equipo)
      : this.equipmentService.registrar(equipo);

    peticion.subscribe({
      next: guardado => {
        const accion = this.esEdicion ? 'actualizó' : 'registró';
        this.router.navigate(['/equipos'], { state: { mensaje: `Se ${accion} el equipo ${guardado.nameEquipment}.` } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set('No tienes acceso para guardar equipos en esa área.');
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? 'Revisa los datos del formulario.');
        } else {
          this.error.set('No se pudo guardar el equipo.');
        }
      }
    });
  }
}
