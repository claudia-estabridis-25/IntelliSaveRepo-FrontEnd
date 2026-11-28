import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { CompanyService } from '../../services/company.service';
import { LoginService } from '../../services/login.service';
import { Company } from '../../models/company';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Paginacion } from '../../utils/paginacion';

@Component({
  selector: 'app-empresa-listar',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, RouterLink, TraducirPipe],
  templateUrl: './empresa-listar.html',
  styleUrl: './empresa-listar.css'
})
export class EmpresaListar implements OnInit {
  empresas = signal<Company[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  esAdmin = false;
  columnas: string[] = ['ruc', 'nombre', 'direccion', 'correo'];

  paginacion = new Paginacion(() => this.empresas());

  constructor(
    private companyService: CompanyService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    if (this.esAdmin) {
      this.columnas = [...this.columnas, 'acciones'];
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.companyService.listar().subscribe({
      next: datos => {
        this.empresas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de empresas.'));
        this.cargando.set(false);
      }
    });
  }

  eliminar(empresa: Company): void {
    if (!confirm(this.idiomaService.t('¿Eliminar la empresa {0}? También se eliminarán sus sedes, áreas, usuarios, equipos y consumos. Esta acción no se puede deshacer.', [empresa.comercialNamecompany]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.companyService.eliminar(empresa.idCompany).subscribe({
      next: () => {
        this.empresas.update(lista => lista.filter(e => e.idCompany !== empresa.idCompany));
        this.mensaje.set(this.idiomaService.t('Se eliminó la empresa {0}.', [empresa.comercialNamecompany]));
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          this.idiomaService.t(
            err.status === 403
              ? 'No tienes acceso para eliminar esta empresa.'
              : 'No se pudo eliminar la empresa.'
          )
        );
      }
    });
  }
}