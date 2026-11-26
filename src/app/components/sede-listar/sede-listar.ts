import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Branch } from '../../models/branch';

@Component({
  selector: 'app-sede-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, TraducirPipe],
  templateUrl: './sede-listar.html',
  styleUrl: './sede-listar.css'
})
export class SedeListar implements OnInit {
  sedes = signal<Branch[]>([]);
  empresas = signal<Map<number, string>>(new Map());
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  // HU117: filtro por empresa ('' = todas). Solo se muestra si el usuario ve más de una empresa.
  empresaFiltro = signal<number | ''>('');

  listaEmpresas = computed(() =>
    [...this.empresas()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  );

  columnas = computed(() =>
    this.empresas().size > 1
      ? ['nombre', 'direccion', 'empresa', 'acciones']
      : ['nombre', 'direccion', 'acciones']
  );

  constructor(private branchService: BranchService, private companyService: CompanyService, private idiomaService: IdiomaService) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.cargar();
    this.companyService.listar().subscribe({
      next: datos => this.empresas.set(new Map(datos.map(empresa => [empresa.idCompany, empresa.comercialNamecompany])))
    });
  }

  filtrarPorEmpresa(idCompany: number | ''): void {
    this.empresaFiltro.set(idCompany);
    this.mensaje.set('');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const idCompany = this.empresaFiltro();
    const peticion = idCompany === '' ? this.branchService.listar() : this.branchService.listarPorEmpresa(idCompany);
    peticion.subscribe({
      next: datos => {
        this.sedes.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de sedes.'));
        this.cargando.set(false);
      }
    });
  }

  nombreEmpresa(idCompany: number): string {
    return this.empresas().get(idCompany) ?? this.idiomaService.t('Empresa {0}', [idCompany]);
  }

  eliminar(sede: Branch): void {
    if (!confirm(this.idiomaService.t('¿Eliminar la sede {0}?', [sede.nameBranch]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.branchService.eliminar(sede.idBranch).subscribe({
      next: () => {
        this.sedes.update(lista => lista.filter(s => s.idBranch !== sede.idBranch));
        this.mensaje.set(this.idiomaService.t('Se eliminó la sede {0}.', [sede.nameBranch]));
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.error.set(this.idiomaService.t('No tienes acceso para eliminar esta sede.'));
        } else if (err.status === 409) {
          this.error.set(this.idiomaService.t('No se puede eliminar la sede {0} porque tiene áreas, tarifas o registros de clima.', [sede.nameBranch]));
        } else {
          this.error.set(this.idiomaService.t('No se pudo eliminar la sede.'));
        }
      }
    });
  }
}
