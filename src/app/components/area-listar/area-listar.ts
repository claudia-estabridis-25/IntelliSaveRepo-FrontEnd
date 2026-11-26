import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subject, catchError, map, of, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-area-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule, RouterLink, TraducirPipe],
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
  // HU121: filtros por sede ('' = todas) y por nombre.
  sedeFiltro = signal<number | ''>('');
  nombreFiltro = signal('');
  hayFiltros = computed(() => this.sedeFiltro() !== '' || this.nombreFiltro().trim() !== '');
  private recargar$ = new Subject<number>();

  listaSedes = computed(() =>
    [...this.sedes().values()].sort((a, b) => a.nameBranch.localeCompare(b.nameBranch))
  );

  columnas = computed(() =>
    this.empresas().size > 1
      ? ['nombre', 'jefe', 'sede', 'empresa', 'descripcion', 'acciones']
      : ['nombre', 'jefe', 'sede', 'descripcion', 'acciones']
  );

  constructor(
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private companyService: CompanyService,
    private idiomaService: IdiomaService
  ) {
    // switchMap cancela la consulta anterior si el usuario cambia el filtro antes de que llegue la respuesta;
    // la espera evita una petición por cada letra al buscar por nombre.
    this.recargar$
      .pipe(
        switchMap(espera =>
          timer(espera).pipe(
            switchMap(() => this.consulta()),
            catchError(() => {
              this.error.set(this.idiomaService.t('No se pudo cargar la lista de áreas.'));
              return of([] as Department[]);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(datos => {
        this.areas.set(datos);
        this.cargando.set(false);
      });
  }

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

  cargar(espera = 0): void {
    this.cargando.set(true);
    this.error.set('');
    this.recargar$.next(espera);
  }

  filtrarPorSede(idBranch: number | ''): void {
    this.sedeFiltro.set(idBranch);
    this.mensaje.set('');
    this.cargar();
  }

  buscar(nombre: string): void {
    this.nombreFiltro.set(nombre);
    this.mensaje.set('');
    this.cargar(300);
  }

  limpiarFiltros(): void {
    this.sedeFiltro.set('');
    this.nombreFiltro.set('');
    this.cargar();
  }

  // Con nombre se usa /search-by-name (y se filtra por sede aquí); solo con sede, /departments/branch/{id}.
  private consulta(): Observable<Department[]> {
    const idBranch = this.sedeFiltro();
    const nombre = this.nombreFiltro().trim();
    if (nombre) {
      return this.departmentService.buscarPorNombre(nombre).pipe(
        map(lista => (idBranch === '' ? lista : lista.filter(area => area.idBranch === idBranch)))
      );
    }
    return idBranch === '' ? this.departmentService.listar() : this.departmentService.listarPorSede(idBranch);
  }

  nombreSede(idBranch: number): string {
    return this.sedes().get(idBranch)?.nameBranch ?? this.idiomaService.t('Sede {0}', [idBranch]);
  }

  nombreEmpresa(idBranch: number): string {
    const sede = this.sedes().get(idBranch);
    return sede ? this.empresas().get(sede.idCompany) ?? '' : '';
  }

  eliminar(area: Department): void {
    if (!confirm(this.idiomaService.t('¿Eliminar el área {0}?', [area.nameDepartment]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.departmentService.eliminar(area.idDepartment).subscribe({
      next: () => {
        this.areas.update(lista => lista.filter(a => a.idDepartment !== area.idDepartment));
        this.mensaje.set(this.idiomaService.t('Se eliminó el área {0}.', [area.nameDepartment]));
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.error.set(this.idiomaService.t('No tienes acceso para eliminar esta área.'));
        } else if (err.status === 409) {
          this.error.set(this.idiomaService.t('No se puede eliminar el área {0} porque tiene equipos o usuarios registrados.', [area.nameDepartment]));
        } else {
          this.error.set(this.idiomaService.t('No se pudo eliminar el área.'));
        }
      }
    });
  }
}
