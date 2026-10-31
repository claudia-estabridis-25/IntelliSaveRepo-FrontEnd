import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { PaginaPendiente } from './components/pagina-pendiente/pagina-pendiente';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

const TODOS = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];
const GESTION = ['ADMIN', 'SUPERVISOR'];

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    canActivateChild: [rolGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, data: { titulo: 'Dashboard', roles: TODOS } },
      { path: 'empresas', component: PaginaPendiente, data: { titulo: 'Empresas', historia: 'HU092', roles: ['ADMIN'] } },
      { path: 'sedes', component: PaginaPendiente, data: { titulo: 'Sedes', historia: 'HU093', roles: ['ADMIN'] } },
      { path: 'areas', component: PaginaPendiente, data: { titulo: 'Áreas', historia: 'HU094', roles: ['ADMIN'] } },
      { path: 'usuarios', component: PaginaPendiente, data: { titulo: 'Usuarios', historia: 'HU095', roles: ['ADMIN'] } },
      { path: 'equipos', component: PaginaPendiente, data: { titulo: 'Equipos', historia: 'HU096', roles: TODOS } },
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
  { path: '**', redirectTo: 'dashboard' }
];