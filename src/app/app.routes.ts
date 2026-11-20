import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
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
import { ConsumoListar } from './components/consumo-listar/consumo-listar';
import { ConsumoRegistrar } from './components/consumo-registrar/consumo-registrar';
import { TarifaListar } from './components/tarifa-listar/tarifa-listar';
import { TarifaRegistrar } from './components/tarifa-registrar/tarifa-registrar';
import { AlertaListar } from './components/alerta-listar/alerta-listar';
import { AlertaRegistrar } from './components/alerta-registrar/alerta-registrar';
import { HuellaListar } from './components/huella-listar/huella-listar';
import { HuellaRegistrar } from './components/huella-registrar/huella-registrar';
import { PrediccionListar } from './components/prediccion-listar/prediccion-listar';
import { PrediccionGenerar } from './components/prediccion-generar/prediccion-generar';
import { Reportes } from './components/reportes/reportes';
import { Perfil } from './components/perfil/perfil';
import { ClimaListar } from './components/clima-listar/clima-listar';
import { EquipoRegistrar } from './components/equipo-registrar/equipo-registrar';
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
      { path: 'equipos/nuevo', component: EquipoRegistrar, data: { titulo: 'Registrar equipo', roles: GESTION } },
      { path: 'equipos/editar/:id', component: EquipoRegistrar, data: { titulo: 'Editar equipo', roles: GESTION } },
      { path: 'consumos', component: ConsumoListar, data: { titulo: 'Consumos', roles: TODOS } },
      { path: 'consumos/nuevo', component: ConsumoRegistrar, data: { titulo: 'Registrar consumo', roles: TODOS } },
      { path: 'consumos/editar/:id', component: ConsumoRegistrar, data: { titulo: 'Editar consumo', roles: GESTION } },
      { path: 'tarifas', component: TarifaListar, data: { titulo: 'Tarifas', roles: GESTION } },
      { path: 'tarifas/nueva', component: TarifaRegistrar, data: { titulo: 'Registrar tarifa', roles: GESTION } },
      { path: 'tarifas/editar/:id', component: TarifaRegistrar, data: { titulo: 'Editar tarifa', roles: GESTION } },
      { path: 'alertas', component: AlertaListar, data: { titulo: 'Alertas', roles: TODOS } },
      { path: 'alertas/nueva', component: AlertaRegistrar, data: { titulo: 'Registrar alerta', roles: GESTION } },
      { path: 'alertas/editar/:id', component: AlertaRegistrar, data: { titulo: 'Editar alerta', roles: GESTION } },
      { path: 'predicciones', component: PrediccionListar, data: { titulo: 'Predicciones', roles: GESTION } },
      { path: 'predicciones/nueva', component: PrediccionGenerar, data: { titulo: 'Generar predicción', roles: GESTION } },
      { path: 'huella', component: HuellaListar, data: { titulo: 'Huella de carbono', roles: GESTION } },
      { path: 'huella/nueva', component: HuellaRegistrar, data: { titulo: 'Calcular huella de carbono', roles: GESTION } },
      { path: 'huella/editar/:id', component: HuellaRegistrar, data: { titulo: 'Recalcular huella de carbono', roles: GESTION } },
      { path: 'clima', component: ClimaListar, data: { titulo: 'Clima', roles: GESTION } },
      { path: 'reportes', component: Reportes, data: { titulo: 'Reportes', roles: GESTION } },
      { path: 'perfil', component: Perfil, data: { titulo: 'Mi perfil', roles: TODOS } }
    ]
  },
  { path: '**', redirectTo: '' }
];