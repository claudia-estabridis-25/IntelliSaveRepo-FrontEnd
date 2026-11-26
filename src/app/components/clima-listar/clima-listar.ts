import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ClimateRecordService } from '../../services/climate-record.service';
import { BranchService } from '../../services/branch.service';
import { LoginService } from '../../services/login.service';
import { CompanyService } from '../../services/company.service';
import { ClimateRecord } from '../../models/climate-record';
import { Branch } from '../../models/branch';

export interface TarjetaClima {
  sede: Branch;
  empresa: string;
  registro: ClimateRecord | null;
}

// Ícono de Material Symbols para cada condición que devuelve el backend (translateWeatherCode).
// Se revisan en orden: "Chubascos de nieve" debe dar nieve y "Parcialmente nublado" antes que "Nublado".
const ICONOS_CONDICION: [string, string][] = [
  ['tormenta', 'thunderstorm'],
  ['nieve', 'weather_snowy'],
  ['lluvia', 'rainy'],
  ['llovizna', 'rainy'],
  ['chubascos', 'rainy'],
  ['niebla', 'foggy'],
  ['parcialmente nublado', 'partly_cloudy_day'],
  ['nublado', 'cloud'],
  ['despejado', 'sunny']
];

@Component({
  selector: 'app-clima-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, DatePipe, DecimalPipe],
  templateUrl: './clima-listar.html',
  styleUrl: './clima-listar.css'
})
export class ClimaListar implements OnInit {
  registros = signal<ClimateRecord[]>([]);
  sedes = signal<Branch[]>([]);
  idSede = signal(0);
  esAdminPlataforma = signal(false);
  empresas = signal(new Map<number, string>());
  cargando = signal(true);
  consultando = signal(false);
  mensaje = signal('');
  error = signal('');
  limite = 100;

  variasEmpresas = computed(() => new Set(this.registros().map(r => r.idCompany)).size > 1);

  columnas = computed(() =>
    this.variasEmpresas()
      ? ['sede', 'empresa', 'fecha', 'condicion', 'temperatura', 'humedad', 'viento']
      : ['sede', 'fecha', 'condicion', 'temperatura', 'humedad', 'viento']
  );

  filtrados = computed(() =>
    this.registros()
      .filter(registro => this.idSede() === 0 || registro.idBranch === this.idSede())
      .sort((a, b) => b.climateDateTime.localeCompare(a.climateDateTime))
  );

  visibles = computed(() => this.filtrados().slice(0, this.limite));

  // HU104: una tarjeta por sede con su último registro de clima.
  tarjetas = computed<TarjetaClima[]>(() => {
    const ultimos = new Map<number, ClimateRecord>();
    for (const registro of this.registros()) {
      const actual = ultimos.get(registro.idBranch);
      if (!actual || registro.climateDateTime > actual.climateDateTime) {
        ultimos.set(registro.idBranch, registro);
      }
    }
    return this.sedes()
      .map(sede => {
        const registro = ultimos.get(sede.idBranch) ?? null;
        return {
          sede,
          registro,
          empresa: registro?.nameCompany ?? this.empresas().get(sede.idCompany) ?? ''
        };
      })
      .sort((a, b) => a.empresa.localeCompare(b.empresa) || a.sede.nameBranch.localeCompare(b.sede.nameBranch));
  });

  constructor(
    private climateRecordService: ClimateRecordService,
    private branchService: BranchService,
    private loginService: LoginService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
    this.loginService.perfilActual().subscribe({
      next: perfil => {
        const adminPlataforma = this.loginService.esAdminPlataforma(perfil);
        this.esAdminPlataforma.set(adminPlataforma);
        if (adminPlataforma) {
          // Para poner el nombre de la empresa en las tarjetas de sedes sin registros.
          this.companyService.listar().subscribe({
            next: empresas => this.empresas.set(new Map(empresas.map(e => [e.idCompany, e.comercialNamecompany])))
          });
        }
      }
    });
  }

  icono(condicion: string): string {
    const texto = condicion.toLowerCase();
    return ICONOS_CONDICION.find(([clave]) => texto.includes(clave))?.[1] ?? 'thermostat';
  }

  cargar(): void {
    this.cargando.set(true);
    this.climateRecordService.listar().subscribe({
      next: datos => {
        this.registros.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial del clima.');
        this.cargando.set(false);
      }
    });
  }

  consultarSede(): void {
    const idSede = this.idSede();
    if (idSede === 0) {
      return;
    }
    this.consultando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.climateRecordService.consultarSede(idSede).subscribe({
      next: registro => {
        this.consultando.set(false);
        // Si el backend actualizó el registro de esta hora, se reemplaza en vez de duplicarlo.
        this.registros.update(lista => [registro, ...lista.filter(r => r.idClimate !== registro.idClimate)]);
        this.mensaje.set(`Clima actual de ${registro.nameBranch}: ${registro.temperature.toFixed(1)} °C, ${registro.climateCondition}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.consultando.set(false);
        this.error.set(err.error?.message ?? 'No se pudo consultar el clima de la sede.');
      }
    });
  }

  actualizarTodas(): void {
    this.consultando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.climateRecordService.actualizarTodas().subscribe({
      next: resultado => {
        this.consultando.set(false);
        this.mensaje.set(`Se guardó el clima de ${resultado.savedRecords} de ${resultado.totalBranches} sedes.`);
        if (resultado.errors.length > 0) {
          this.error.set(`No se pudo actualizar: ${resultado.errors.join('; ')}`);
        }
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.consultando.set(false);
        this.error.set(err.status === 403 ? 'Solo el administrador de la plataforma puede actualizar todas las sedes.' : 'No se pudo actualizar el clima.');
      }
    });
  }
}
