import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AlertService } from '../../services/alert.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { ConteoAlertas, ConteoAlertasArea } from '../../models/estadisticas';
import { ESTADOS_ALERTA, PRIORIDADES_ALERTA } from '../../models/alert';

type Agrupacion = 'estado' | 'tipo';

const COLOR_ESTADO: Record<string, string> = {
  'Pendiente': '#c0392b',
  'En revisión': '#d18f12',
  'Atendida': '#17705b',
  'Descartada': '#c9c1ae'
};
const COLOR_PRIORIDAD: Record<string, string> = { 'Alta': '#c0392b', 'Media': '#d18f12', 'Baja': '#17705b' };
const PALETA_TIPOS = ['#0e2a2b', '#17705b', '#f2b53c', '#5f7a72', '#c9c1ae', '#a1231b'];
const FUENTE_CIFRAS = { family: 'IBM Plex Mono', size: 11 };

// Resultado de cada consulta: si una falla (por ejemplo 403), las demás se muestran igual.
interface Fuente<T> {
  datos: T[];
  error: string;
}

/**
 * Gráficos de las consultas de alertas (Sebastián Ramírez):
 * - GET /api/alerts/count-by-status
 * - GET /api/alerts/count-by-priority
 * - GET /api/alerts/count-by-department (consulta nativa con JOIN: área, tipo y estado)
 */
@Component({
  selector: 'app-alerta-estadisticas',
  imports: [BaseChartDirective, TraducirPipe],
  templateUrl: './alerta-estadisticas.html',
  styleUrl: './alerta-estadisticas.css'
})
export class AlertaEstadisticas implements OnInit {
  private alertService = inject(AlertService);
  private idiomaService = inject(IdiomaService);

  cargando = signal(true);
  porEstado = signal<Fuente<ConteoAlertas>>({ datos: [], error: '' });
  porPrioridad = signal<Fuente<ConteoAlertas>>({ datos: [], error: '' });
  porArea = signal<Fuente<ConteoAlertasArea>>({ datos: [], error: '' });
  agrupacion = signal<Agrupacion>('estado');

  // Los estados y prioridades se muestran siempre en el mismo orden, aunque alguno tenga 0.
  estados = computed(() => this.completar(this.porEstado().datos, ESTADOS_ALERTA));
  prioridades = computed(() => this.completar(this.porPrioridad().datos, PRIORIDADES_ALERTA));

  total = computed(() => this.estados().reduce((suma, fila) => suma + fila.total, 0));
  abiertas = computed(() => this.estados()
    .filter(fila => fila.nombre === 'Pendiente' || fila.nombre === 'En revisión')
    .reduce((suma, fila) => suma + fila.total, 0));

  // Total de alertas por área, de mayor a menor.
  areas = computed(() => {
    const totales = new Map<string, number>();
    for (const fila of this.porArea().datos) {
      totales.set(fila.nameDepartment, (totales.get(fila.nameDepartment) ?? 0) + fila.totalAlerts);
    }
    return [...totales.entries()].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
  });

  areaMayor = computed(() => this.areas()[0] ?? null);

  graficoEstado = computed<ChartConfiguration<'bar'>['data']>(() => {
    this.idiomaService.idioma();
    const filas = this.estados();
    return {
      labels: filas.map(fila => this.idiomaService.t(fila.nombre)),
      datasets: [{
        label: this.idiomaService.t('Alertas'),
        data: filas.map(fila => fila.total),
        backgroundColor: filas.map(fila => COLOR_ESTADO[fila.nombre] ?? '#5f7a72'),
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 72
      }]
    };
  });

  graficoPrioridad = computed<ChartConfiguration<'bar'>['data']>(() => {
    this.idiomaService.idioma();
    const filas = this.prioridades();
    return {
      labels: filas.map(fila => this.idiomaService.t(fila.nombre)),
      datasets: [{
        label: this.idiomaService.t('Alertas'),
        data: filas.map(fila => fila.total),
        backgroundColor: filas.map(fila => COLOR_PRIORIDAD[fila.nombre] ?? '#5f7a72'),
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 72
      }]
    };
  });

  // Barras horizontales apiladas: una barra por área, dividida por estado o por tipo de alerta.
  graficoArea = computed<ChartConfiguration<'bar'>['data']>(() => {
    this.idiomaService.idioma();
    const filas = this.porArea().datos;
    const areas = this.areas().map(area => area.nombre);
    const porEstado = this.agrupacion() === 'estado';
    const grupos = porEstado
      ? ESTADOS_ALERTA.filter(estado => filas.some(fila => fila.statusAlert === estado))
      : [...new Set(filas.map(fila => fila.typeAlert))].sort();

    return {
      labels: areas,
      datasets: grupos.map((grupo, indice) => ({
        label: this.idiomaService.t(grupo),
        data: areas.map(area => filas
          .filter(fila => fila.nameDepartment === area && (porEstado ? fila.statusAlert : fila.typeAlert) === grupo)
          .reduce((suma, fila) => suma + fila.totalAlerts, 0)),
        backgroundColor: porEstado ? COLOR_ESTADO[grupo] ?? '#5f7a72' : PALETA_TIPOS[indice % PALETA_TIPOS.length],
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 72
      }))
    };
  });

  opcionesColumnas = computed<ChartConfiguration<'bar'>['options']>(() => {
    const etiqueta = this.idiomaService.t('Alertas');
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: contexto => `${etiqueta}: ${contexto.parsed.y}` } }
      },
      scales: {
        x: { grid: { display: false }, border: { color: '#c9c1ae' }, ticks: { color: '#0e2a2b', font: { size: 12 } } },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: '#ece6d8' },
          ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, precision: 0, maxTicksLimit: 5 }
        }
      }
    };
  });

  opcionesArea = computed<ChartConfiguration<'bar'>['options']>(() => {
    this.idiomaService.idioma();
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, color: '#0e2a2b', font: { size: 12 } } },
        tooltip: { callbacks: { label: contexto => `${contexto.dataset.label}: ${contexto.parsed.x}` } }
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          border: { display: false },
          grid: { color: '#ece6d8' },
          ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, precision: 0, maxTicksLimit: 6 }
        },
        y: { stacked: true, grid: { display: false }, border: { color: '#c9c1ae' }, ticks: { color: '#0e2a2b', font: { size: 12 } } }
      }
    };
  });

  // Alto del gráfico por área según la cantidad de áreas, para que las barras no queden aplastadas.
  altoArea = computed(() => Math.max(180, this.areas().length * 44 + 70));

  ngOnInit(): void {
    forkJoin({
      estado: this.alertService.contarPorEstado().pipe(catchError(err => of(this.fallo<ConteoAlertas>(err)))),
      prioridad: this.alertService.contarPorPrioridad().pipe(catchError(err => of(this.fallo<ConteoAlertas>(err)))),
      area: this.alertService.contarPorArea().pipe(catchError(err => of(this.fallo<ConteoAlertasArea>(err))))
    }).subscribe(resultado => {
      this.porEstado.set(this.fuente(resultado.estado));
      this.porPrioridad.set(this.fuente(resultado.prioridad));
      this.porArea.set(this.fuente(resultado.area));
      this.cargando.set(false);
    });
  }

  private completar(filas: ConteoAlertas[], orden: string[]): { nombre: string; total: number }[] {
    const conteo = new Map(filas.map(fila => [fila.category, fila.totalAlerts]));
    const extras = filas.map(fila => fila.category).filter(nombre => !orden.includes(nombre));
    return [...orden, ...extras].map(nombre => ({ nombre, total: conteo.get(nombre) ?? 0 }));
  }

  private fuente<T>(resultado: T[] | Fuente<T>): Fuente<T> {
    return Array.isArray(resultado) ? { datos: resultado, error: '' } : resultado;
  }

  // Los mensajes se guardan como clave en español y se traducen en la plantilla.
  private fallo<T>(err: HttpErrorResponse): Fuente<T> {
    return {
      datos: [],
      error: err.status === 403 ? 'No tienes acceso a esta consulta.' : 'No se pudo cargar esta consulta.'
    };
  }
}
