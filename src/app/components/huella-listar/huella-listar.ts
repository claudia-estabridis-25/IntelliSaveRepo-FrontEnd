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

@Component({
  selector: 'app-huella-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe],
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

  constructor(private carbonFootprintService: CarbonFootprintService, private loginService: LoginService) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.carbonFootprintService.listar().subscribe({
      next: datos => {
        this.huellas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de huellas de carbono.');
        this.cargando.set(false);
      }
    });
  }

  eliminar(huella: CarbonFootprint): void {
    if (!confirm(`¿Eliminar la huella ${huella.timePeriod.toLowerCase()} de ${huella.nameDepartment}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.carbonFootprintService.eliminar(huella.idFootprint).subscribe({
      next: () => {
        this.huellas.update(lista => lista.filter(h => h.idFootprint !== huella.idFootprint));
        this.mensaje.set(`Se eliminó la huella de ${huella.nameDepartment}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso para eliminar esta huella.' : 'No se pudo eliminar la huella.');
      }
    });
  }
}
