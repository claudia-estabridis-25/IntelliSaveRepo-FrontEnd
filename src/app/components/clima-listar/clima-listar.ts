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
import { ClimateRecord } from '../../models/climate-record';
import { Branch } from '../../models/branch';

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

  constructor(
    private climateRecordService: ClimateRecordService,
    private branchService: BranchService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
    this.loginService.obtenerPerfil().subscribe({
      next: perfil => this.esAdminPlataforma.set(perfil.idCompany === null && perfil.roles.includes('ROLE_ADMIN'))
    });
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
        this.registros.update(lista => [registro, ...lista]);
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
