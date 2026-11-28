import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';
import { ROLES, Usuario } from '../../models/usuario';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Paginacion } from '../../utils/paginacion';

@Component({
  selector: 'app-usuario-listar',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterLink, TraducirPipe],
  templateUrl: './usuario-listar.html',
  styleUrl: './usuario-listar.css'
})
export class UsuarioListar implements OnInit {
  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  texto = signal('');
  rol = signal('');
  correoActual = '';
  roles = Object.entries(ROLES);

  variasEmpresas = computed(() => new Set(this.usuarios().map(u => u.idCompany).filter(id => id !== null)).size > 1);

  columnas = computed(() =>
    this.variasEmpresas()
      ? ['nombre', 'dni', 'puesto', 'rol', 'area', 'empresa', 'estado', 'acciones']
      : ['nombre', 'dni', 'puesto', 'rol', 'area', 'estado', 'acciones']
  );

  filtrados = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    return this.usuarios().filter(usuario =>
      (!this.rol() || usuario.roles.includes(this.rol())) &&
      (!texto || `${this.nombreCompleto(usuario)} ${usuario.emailUser} ${usuario.dniUser}`.toLowerCase().includes(texto))
    );
  });

  paginacion = new Paginacion(() => this.filtrados());

  constructor(
    private usuarioService: UsuarioService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.correoActual = this.loginService.obtenerUsuario().toLowerCase();
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: datos => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de usuarios.'));
        this.cargando.set(false);
      }
    });
  }

  filtrarTexto(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  nombreCompleto(usuario: Usuario): string {
    return [usuario.firstName, usuario.secondName, usuario.paternalSurname, usuario.maternalSurname]
      .filter(parte => !!parte)
      .join(' ');
  }

  nombreRol(usuario: Usuario): string {
    if (usuario.roles.includes('ROLE_ADMIN')) {
      return this.idiomaService.t(usuario.idCompany === null ? 'Admin. de plataforma' : 'Admin. de empresa');
    }
    return usuario.roles.map(rol => this.idiomaService.t(ROLES[rol] ?? rol)).join(', ');
  }

  esUsuarioActual(usuario: Usuario): boolean {
    return usuario.emailUser.toLowerCase() === this.correoActual;
  }

  desactivar(usuario: Usuario): void {
    if (!confirm(this.idiomaService.t('¿Desactivar a {0}? Ya no podrá iniciar sesión.', [this.nombreCompleto(usuario)]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.usuarioService.desactivar(usuario.idUser).subscribe({
      next: actualizado => {
        this.usuarios.update(lista => lista.map(u => u.idUser === actualizado.idUser ? actualizado : u));
        this.mensaje.set(this.idiomaService.t('Se desactivó a {0}.', [this.nombreCompleto(usuario)]));
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.error.set(this.idiomaService.t('No tienes acceso para desactivar a este usuario.'));
        } else {
          this.error.set(err.error?.message ?? this.idiomaService.t('No se pudo desactivar al usuario.'));
        }
      }
    });
  }
}
