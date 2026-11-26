import { Component, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { LoginService } from '../../services/login.service';
import { Usuario } from '../../models/usuario';
import { Idioma } from '../../models/idioma';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, TraducirPipe],
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
        { texto: 'Empresas', icono: 'domain', ruta: '/empresas', roles: ['ADMIN_PLATAFORMA'] },
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
        { texto: 'Comparar sedes', icono: 'compare_arrows', ruta: '/comparar-sedes', roles: GESTION },
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
    private breakpointObserver: BreakpointObserver,
    private idiomaService: IdiomaService
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
    this.armarMenu(null);
    this.actualizarTitulo();

    // HU091: el menú final depende del nivel de administrador, que sale del perfil.
    this.loginService.perfilActual().subscribe(perfil => {
      this.armarMenu(perfil);
      this.empresa.set(perfil?.nameCompany ?? 'IntelliSave');
      this.sede.set(perfil ? perfil.nameBranch ?? 'Todas las empresas' : '');
    });
  }

  private armarMenu(perfil: Usuario | null): void {
    this.rolPrincipal.set(this.loginService.nombreRol(perfil));
    this.secciones.set(
      this.menu
        .map(seccion => ({
          titulo: seccion.titulo,
          opciones: seccion.opciones.filter(opcion => this.loginService.puedeAcceder(opcion.roles, perfil))
        }))
        .filter(seccion => seccion.opciones.length > 0)
    );
  }

  idioma = (): Idioma => this.idiomaService.idioma();

  // HU162 CA01 y CA03: el selector está en la barra superior y el idioma se recuerda (IdiomaService).
  cambiarIdioma(idioma: Idioma): void {
    this.idiomaService.cambiar(idioma);
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
}
