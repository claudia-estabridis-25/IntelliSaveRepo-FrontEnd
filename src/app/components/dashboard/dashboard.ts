import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from '../../services/login.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  perfil = signal<Usuario | null>(null);
  errorPerfil = signal('');
  roles: string[] = [];
  usuario = '';

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    this.usuario = this.loginService.obtenerUsuario();
    this.roles = this.loginService.obtenerRoles().map(rol => rol.replace('ROLE_', ''));
    this.loginService.obtenerPerfil().subscribe({
      next: datos => this.perfil.set(datos),
      error: () => this.errorPerfil.set('No se pudo obtener el perfil desde la API.')
    });
  }

  cerrarSesion(): void {
    this.loginService.cerrarSesion();
  }
}