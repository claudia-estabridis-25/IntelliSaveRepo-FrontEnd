import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { PaginaPendiente } from './components/pagina-pendiente/pagina-pendiente';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';
import { EmpresaRegistrar } from './components/empresa-registrar/empresa-registrar';
import { SedeListar } from './components/sede-listar/sede-listar';
import { SedeRegistrar } from './components/sede-registrar/sede-registrar';
import { UsuarioListar } from './components/usuario-listar/usuario-listar';
import { UsuarioRegistrar } from './components/usuario-registrar/usuario-registrar';
import { AreaListar } from './components/area-listar/area-listar';
import { AreaRegistrar } from './components/area-registrar/area-registrar';
import { EmpresaListar } from './components/empresa-listar/empresa-listar';
import { EquipoListar } from './components/equipo-listar/equipo-listar';
import { Landing } from './components/landing/landing';

const TODOS = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];
const GESTION = ['ADMIN', 'SUPERVISOR'];

export const routes: Routes = [
  { path: '', component: Landing, pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    canActivateChild: [rolGuard],
    children: [
      //{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, data: { titulo: 'Dashboard', roles: TODOS } },
      { path: 'empresas', component: EmpresaListar, data: { titulo: 'Empresas', roles: ['ADMIN'] } },
      { path: 'empresas/nueva', component: EmpresaRegistrar, data: { titulo: 'Registrar empresa', roles: ['ADMIN'] } },
      { path: 'empresas/editar/:id', component: EmpresaRegistrar, data: { titulo: 'Editar empresa', roles: ['ADMIN'] } },
      { path: 'sedes', component: SedeListar, data: { titulo: 'Sedes', roles: ['ADMIN'] } },
      { path: 'sedes/nueva', component: SedeRegistrar, data: { titulo: 'Registrar sede', roles: ['ADMIN'] } },
      { path: 'sedes/editar/:id', component: SedeRegistrar, data: { titulo: 'Editar sede', roles: ['ADMIN'] } },
      { path: 'areas', component: AreaListar, data: { titulo: 'Áreas', roles: ['ADMIN'] } },
      { path: 'areas/nueva', component: AreaRegistrar, data: { titulo: 'Registrar área', roles: ['ADMIN'] } },
      { path: 'areas/editar/:id', component: AreaRegistrar, data: { titulo: 'Editar área', roles: ['ADMIN'] } },
      { path: 'usuarios', component: UsuarioListar, data: { titulo: 'Usuarios', roles: ['ADMIN'] } },
      { path: 'usuarios/nuevo', component: UsuarioRegistrar, data: { titulo: 'Registrar usuario', roles: ['ADMIN'] } },
      { path: 'usuarios/editar/:id', component: UsuarioRegistrar, data: { titulo: 'Editar usuario', roles: ['ADMIN'] } },
      { path: 'equipos', component: EquipoListar, data: { titulo: 'Equipos', roles: TODOS } },
      { path: 'equipos/nuevo', component: PaginaPendiente, data: { titulo: 'Registrar equipo', historia: 'HU096', roles: GESTION } },
      { path: 'consumos', component: PaginaPendiente, data: { titulo: 'Consumos', historia: 'HU097', roles: TODOS } },
      { path: 'tarifas', component: PaginaPendiente, data: { titulo: 'Tarifas', historia: 'HU098', roles: GESTION } },
      { path: 'alertas', component: PaginaPendiente, data: { titulo: 'Alertas', historia: 'HU101', roles: TODOS } },
      { path: 'predicciones', component: PaginaPendiente, data: { titulo: 'Predicciones', historia: 'HU102', roles: GESTION } },
      { path: 'huella', component: PaginaPendiente, data: { titulo: 'Huella de carbono', historia: 'HU103', roles: GESTION } },
      { path: 'clima', component: PaginaPendiente, data: { titulo: 'Clima', historia: 'HU104', roles: GESTION } },
      { path: 'reportes', component: PaginaPendiente, data: { titulo: 'Reportes', historia: 'HU105', roles: GESTION } },
      { path: 'perfil', component: PaginaPendiente, data: { titulo: 'Mi perfil', historia: 'HU099', roles: TODOS } }
    ]
  },
  { path: '**', redirectTo: '' }
];