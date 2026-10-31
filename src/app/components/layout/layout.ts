import { Component, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LoginService } from '../../services/login.service';

interface OpcionMenu {
  texto: string;
  icono: string;
  ruta: string;
  roles: string[];
}

interface SeccionMenu {
  titulo: string;
  opciones: OpcionMenu[];
}

const TODOS = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];
const GESTION = ['ADMIN', 'SUPERVISOR'];

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  esMovil = signal(false);
  titulo = signal('');
  empresa = signal('');
  sede = signal('');
  usuario = signal('');
  rolPrincipal = signal('');
  secciones = signal<SeccionMenu[]>([]);

  private menu: SeccionMenu[] = [
    {
      titulo: '',
      opciones: [
        { texto: 'Dashboard', icono: 'dashboard', ruta: '/dashboard', roles: TODOS }
      ]
    },
    {
      titulo: 'Organización',
      opciones: [
        { texto: 'Empresas', icono: 'domain', ruta: '/empresas', roles: ['ADMIN'] },
        { texto: 'Sedes', icono: 'location_on', ruta: '/sedes', roles: ['ADMIN'] },
        { texto: 'Áreas', icono: 'grid_view', ruta: '/areas', roles: ['ADMIN'] },
        { texto: 'Usuarios', icono: 'group', ruta: '/usuarios', roles: ['ADMIN'] }
      ]
    },
    {
      titulo: 'Energía',
      opciones: [
        { texto: 'Equipos', icono: 'power', ruta: '/equipos', roles: TODOS },
        { texto: 'Consumos', icono: 'bolt', ruta: '/consumos', roles: TODOS },
        { texto: 'Tarifas', icono: 'payments', ruta: '/tarifas', roles: GESTION },
        { texto: 'Alertas', icono: 'notifications', ruta: '/alertas', roles: TODOS }
      ]
    },
    {
      titulo: 'Análisis',
      opciones: [
        { texto: 'Predicciones', icono: 'insights', ruta: '/predicciones', roles: GESTION },
        { texto: 'Huella de carbono', icono: 'eco', ruta: '/huella', roles: GESTION },
        { texto: 'Clima', icono: 'partly_cloudy_day', ruta: '/clima', roles: GESTION },
        { texto: 'Reportes', icono: 'description', ruta: '/reportes', roles: GESTION }
      ]
    },
    {
      titulo: 'Cuenta',
      opciones: [
        { texto: 'Mi perfil', icono: 'account_circle', ruta: '/perfil', roles: TODOS }
      ]
    }
  ];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpointObserver
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed())
      .subscribe(resultado => this.esMovil.set(resultado.matches));

    this.router.events
      .pipe(filter(evento => evento instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.actualizarTitulo());
  }

  ngOnInit(): void {
    this.usuario.set(this.loginService.obtenerUsuario());
    this.rolPrincipal.set(this.obtenerNombreRol());
    this.secciones.set(
      this.menu
        .map(seccion => ({
          titulo: seccion.titulo,
          opciones: seccion.opciones.filter(opcion => opcion.roles.some(rol => this.loginService.tieneRol(rol)))
        }))
        .filter(seccion => seccion.opciones.length > 0)
    );
    this.actualizarTitulo();

    this.loginService.obtenerPerfil().subscribe({
      next: perfil => {
        this.empresa.set(perfil.nameCompany ?? 'IntelliSave');
        this.sede.set(perfil.nameBranch ?? 'Todas las empresas');
      },
      error: () => {
        this.empresa.set('IntelliSave');
        this.sede.set('');
      }
    });
  }

  cerrarSesion(): void {
    this.loginService.cerrarSesion();
  }

  private actualizarTitulo(): void {
    let ruta = this.route;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    this.titulo.set(ruta.snapshot.data['titulo'] ?? '');
  }

  private obtenerNombreRol(): string {
    if (this.loginService.tieneRol('ADMIN')) {
      return 'Administrador';
    }
    if (this.loginService.tieneRol('SUPERVISOR')) {
      return 'Supervisor energético';
    }
    return 'Empleado de área';
  }
}