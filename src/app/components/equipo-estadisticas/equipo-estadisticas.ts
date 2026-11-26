import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { EquipmentService } from '../../services/equipment.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { ReporteEquiposCategoria } from '../../models/estadisticas';

interface TotalCategoria {
  categoria: string;
  equipos: number;
  activos: number;
  kwh: number;
}

const FUENTE_CIFRAS = { family: 'IBM Plex Mono', size: 11 };

@Component({
  selector: 'app-equipo-estadisticas',
  imports: [BaseChartDirective, DecimalPipe, TraducirPipe],
  templateUrl: './equipo-estadisticas.html',
  styleUrl: './equipo-estadisticas.css'
})
export class EquipoEstadisticas implements OnInit {
  private equipmentService = inject(EquipmentService);
  private idiomaService = inject(IdiomaService);

  cargando = signal(true);
  error = signal('');
  filas = signal<ReporteEquiposCategoria[]>([]);

  variasEmpresas = computed(() => new Set(this.filas().map(fila => fila.idCompany)).size > 1);

  totalEquipos = computed(() => this.filas().reduce((suma, fila) => suma + fila.totalEquipments, 0));
  totalActivos = computed(() => this.filas().reduce((suma, fila) => suma + fila.activeEquipments, 0));
  potenciaKw = computed(() => this.filas().reduce((suma, fila) => suma + fila.activePowerWatts, 0) / 1000);

  categorias = computed<TotalCategoria[]>(() => {
    const mapa = new Map<string, TotalCategoria>();
    for (const fila of this.filas()) {
      const actual = mapa.get(fila.categoryEquipment) ?? { categoria: fila.categoryEquipment, equipos: 0, activos: 0, kwh: 0 };
      actual.equipos += fila.totalEquipments;
      actual.activos += fila.activeEquipments;
      actual.kwh += fila.totalKwh;
      mapa.set(fila.categoryEquipment, actual);
    }
    return [...mapa.values()].sort((a, b) => b.kwh - a.kwh);
  });

  categoriaMayor = computed(() => {
    const primera = this.categorias()[0];
    return primera && primera.kwh > 0 ? primera : null;
  });

  grafico = computed<ChartConfiguration<'bar'>['data']>(() => {
    this.idiomaService.idioma();
    const datos = this.categorias();
    const mayor = this.categoriaMayor()?.categoria;
    return {
      labels: datos.map(dato => dato.categoria),
      datasets: [{
        label: 'kWh',
        data: datos.map(dato => Math.round(dato.kwh * 100) / 100),
        backgroundColor: datos.map(dato => dato.categoria === mayor ? '#f2b53c' : '#17705b'),
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 40
      }]
    };
  });

  opciones: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: contexto => `${contexto.parsed.x} kWh` } }
    },
    scales: {
      x: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#ece6d8' },
        ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, maxTicksLimit: 6 }
      },
      y: { grid: { display: false }, border: { color: '#c9c1ae' }, ticks: { color: '#0e2a2b', font: { size: 12 } } }
    }
  };

  altoGrafico = computed(() => Math.max(180, this.categorias().length * 44 + 50));

  ngOnInit(): void {
    this.equipmentService.reportePorCategoria().subscribe({
      next: datos => {
        this.filas.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso a esta consulta.' : 'No se pudo cargar esta consulta.');
        this.cargando.set(false);
      }
    });
  }
}