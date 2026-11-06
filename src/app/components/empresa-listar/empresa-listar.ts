import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { CompanyService } from '../../services/company.service';
import { LoginService } from '../../services/login.service';
import { Company } from '../../models/company';

@Component({
  selector: 'app-empresa-listar',
  imports: [MatTableModule, MatButtonModule, RouterLink],
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

  constructor(private companyService: CompanyService, private loginService: LoginService) {}

  ngOnInit(): void {
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
        this.error.set('No se pudo cargar la lista de empresas.');
        this.cargando.set(false);
      }
    });
  }

  eliminar(empresa: Company): void {
    if (!confirm(`¿Eliminar la empresa ${empresa.comercialNamecompany}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.companyService.eliminar(empresa.idCompany).subscribe({
      next: () => {
        this.empresas.update(lista => lista.filter(e => e.idCompany !== empresa.idCompany));
        this.mensaje.set(`Se eliminó la empresa ${empresa.comercialNamecompany}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 403
            ? 'No tienes acceso para eliminar esta empresa.'
            : 'No se pudo eliminar la empresa. Revisa que no tenga sedes registradas.'
        );
      }
    });
  }
}