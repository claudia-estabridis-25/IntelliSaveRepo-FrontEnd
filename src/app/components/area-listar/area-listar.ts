import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';

@Component({
  selector: 'app-area-listar',
  imports: [MatTableModule, MatButtonModule, RouterLink],
  templateUrl: './area-listar.html',
  styleUrl: './area-listar.css'
})
export class AreaListar implements OnInit {
  areas = signal<Department[]>([]);
  sedes = signal<Map<number, Branch>>(new Map());
  empresas = signal<Map<number, string>>(new Map());
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');

  columnas = computed(() =>
    this.empresas().size > 1
      ? ['nombre', 'jefe', 'sede', 'empresa', 'descripcion', 'acciones']
      : ['nombre', 'jefe', 'sede', 'descripcion', 'acciones']
  );

  constructor(
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.cargar();
    this.branchService.listar().subscribe({
      next: datos => this.sedes.set(new Map(datos.map(sede => [sede.idBranch, sede])))
    });
    this.companyService.listar().subscribe({
      next: datos => this.empresas.set(new Map(datos.map(empresa => [empresa.idCompany, empresa.comercialNamecompany])))
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.departmentService.listar().subscribe({
      next: datos => {
        this.areas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de áreas.');
        this.cargando.set(false);
      }
    });
  }

  nombreSede(idBranch: number): string {
    return this.sedes().get(idBranch)?.nameBranch ?? `Sede ${idBranch}`;
  }

  nombreEmpresa(idBranch: number): string {
    const sede = this.sedes().get(idBranch);
    return sede ? this.empresas().get(sede.idCompany) ?? '' : '';
  }

  eliminar(area: Department): void {
    if (!confirm(`¿Eliminar el área ${area.nameDepartment}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.departmentService.eliminar(area.idDepartment).subscribe({
      next: () => {
        this.areas.update(lista => lista.filter(a => a.idDepartment !== area.idDepartment));
        this.mensaje.set(`Se eliminó el área ${area.nameDepartment}.`);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.error.set('No tienes acceso para eliminar esta área.');
        } else if (err.status === 409) {
          this.error.set(`No se puede eliminar el área ${area.nameDepartment} porque tiene equipos o usuarios registrados.`);
        } else {
          this.error.set('No se pudo eliminar el área.');
        }
      }
    });
  }
}
