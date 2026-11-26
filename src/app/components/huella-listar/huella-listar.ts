import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CarbonFootprintService } from '../../services/carbon-footprint.service';
import { LoginService } from '../../services/login.service';
import { CarbonFootprint, PERIODOS_HUELLA } from '../../models/carbon-footprint';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-huella-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe, TraducirPipe],
  templateUrl: './huella-listar.html',
  styleUrl: './huella-listar.css'
})
export class HuellaListar implements OnInit {
  huellas = signal<CarbonFootprint[]>([]);
  periodo = signal('');
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  esAdmin = false;
  periodos = PERIODOS_HUELLA;
  columnas = ['area', 'periodo', 'kwh', 'factor', 'co2', 'acciones'];

  filtradas = computed(() =>
    this.huellas()
      .filter(huella => !this.periodo() || huella.timePeriod === this.periodo())
      .sort((a, b) => b.calculationDate.localeCompare(a.calculationDate))
  );

  totalCo2 = computed(() => this.filtradas().reduce((suma, huella) => suma + huella.co2Emissions, 0));

  constructor(
    private carbonFootprintService: CarbonFootprintService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.carbonFootprintService.listar().subscribe({
      next: datos => {
        this.huellas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de huellas de carbono.'));
        this.cargando.set(false);
      }
    });
  }

  eliminar(huella: CarbonFootprint): void {
    if (!confirm(this.idiomaService.t('¿Eliminar la huella {0} de {1}?', [this.idiomaService.t(huella.timePeriod).toLowerCase(), huella.nameDepartment]))) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.carbonFootprintService.eliminar(huella.idFootprint).subscribe({
      next: () => {
        this.huellas.update(lista => lista.filter(h => h.idFootprint !== huella.idFootprint));
        this.mensaje.set(this.idiomaService.t('Se eliminó la huella de {0}.', [huella.nameDepartment]));
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.idiomaService.t(err.status === 403 ? 'No tienes acceso para eliminar esta huella.' : 'No se pudo eliminar la huella.'));
      }
    });
  }
}
