import { Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { CarbonFootprintService } from '../../services/carbon-footprint.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { CarbonFootprint, PERIODOS_HUELLA } from '../../models/carbon-footprint';
import { ComparacionHuella, EmisionArea, EmisionSede } from '../../models/estadisticas';

type Metrica = 'co2' | 'kwh';
type Alcance = 'area' | 'sede';

interface Barra {
  nombre: string;
  co2: number;
  kwh: number;
  calculos: number;
}

interface Fuente<T> {
  datos: T[];
  error: string;
}

const FUENTE_CIFRAS = { family: 'IBM Plex Mono', size: 11 };

/**
 * Gráficos de las consultas de huella de carbono (Sebastián Ramírez):
 * - GET /api/carbon-footprints/by-department (emisiones por área)
 * - GET /api/carbon-footprints/by-branch (emisiones por sede)
 * - GET /api/carbon-footprints/compare (un área o una sede entre dos fechas de cálculo)
 */
@Component({
  selector: 'app-huella-estadisticas',
  imports: [BaseChartDirective, DatePipe, DecimalPipe, MatButtonModule, MatFormFieldModule, MatSelectModule, TraducirPipe],
  templateUrl: './huella-estadisticas.html',
  styleUrl: './huella-estadisticas.css'
})
export class HuellaEstadisticas implements OnInit {
  private carbonFootprintService = inject(CarbonFootprintService);
  private idiomaService = inject(IdiomaService);

  // Cálculos que ya cargó la pantalla de huella: sirven para saber qué fechas se pueden comparar.
  huellas = input<CarbonFootprint[]>([]);

  cargando = signal(true);
  porArea = signal<Fuente<EmisionArea>>({ datos: [], error: '' });
  porSede = signal<Fuente<EmisionSede>>({ datos: [], error: '' });
  metrica = signal<Metrica>('co2');

  // Comparación entre dos periodos
  alcance = signal<Alcance>('area');
  idElegido = signal(0);
  periodo = signal('');
  fechaA = signal('');
  fechaB = signal('');
  comparando = signal(false);
  comparacion = signal<ComparacionHuella | null>(null);
  errorComparacion = signal('');

  // Un área puede llamarse igual en dos sedes: se muestra "Área · Sede" cuando se conoce la sede.
  private sedeDeArea = computed(() => new Map(this.huellas().map(h => [h.idDepartment, h.nameBranch])));

  barrasArea = computed<Barra[]>(() => this.porArea().datos
    .map(fila => {
      const sede = this.sedeDeArea().get(fila.idDepartment);
      return {
        nombre: sede ? `${fila.nameDepartment} · ${sede}` : fila.nameDepartment,
        co2: fila.totalCo2Emissions,
        kwh: fila.totalKwh,
        calculos: fila.totalCalculations
      };
    })
    .sort((a, b) => b.co2 - a.co2));

  barrasSede = computed<Barra[]>(() => this.porSede().datos
    .map(fila => ({ nombre: fila.nameBranch, co2: fila.totalCo2Emissions, kwh: fila.totalKwh, calculos: fila.totalCalculations }))
    .sort((a, b) => b.co2 - a.co2));

  totalCo2 = computed(() => this.barrasArea().reduce((suma, b) => suma + b.co2, 0));
  totalKwh = computed(() => this.barrasArea().reduce((suma, b) => suma + b.kwh, 0));
  totalCalculos = computed(() => this.barrasArea().reduce((suma, b) => suma + b.calculos, 0));

  graficoArea = computed(() => this.datosBarras(this.barrasArea(), '#0e2a2b'));
  graficoSede = computed(() => this.datosBarras(this.barrasSede(), '#17705b'));
  opcionesArea = computed(() => this.opcionesBarras(true));
  opcionesSede = computed(() => this.opcionesBarras(false));
  altoArea = computed(() => Math.max(180, this.barrasArea().length * 40 + 60));

  // Opciones de la comparación, armadas con los cálculos existentes.
  opcionesAlcance = computed(() => {
    const vistos = new Map<number, string>();
    for (const h of this.huellas()) {
      if (this.alcance() === 'area') {
        vistos.set(h.idDepartment, `${h.nameDepartment} · ${h.nameBranch}`);
      } else {
        vistos.set(h.idBranch, h.nameBranch);
      }
    }
    return [...vistos.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  private delElegido = computed(() => this.huellas().filter(h =>
    (this.alcance() === 'area' ? h.idDepartment : h.idBranch) === this.idElegido()));

  periodosDisponibles = computed(() => PERIODOS_HUELLA.filter(p => this.delElegido().some(h => h.timePeriod === p)));

  fechasDisponibles = computed(() => [...new Set(this.delElegido()
    .filter(h => h.timePeriod === this.periodo())
    .map(h => h.calculationDate))].sort());

  puedeComparar = computed(() => !!this.fechaA() && !!this.fechaB() && this.fechaA() !== this.fechaB());

  graficoComparacion = computed<ChartConfiguration<'bar'>['data']>(() => {
    this.idiomaService.idioma();
    const datos = this.comparacion();
    if (!datos) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: [this.fechaCorta(datos.dateA), this.fechaCorta(datos.dateB)],
      datasets: [{
        label: this.idiomaService.t('Emisiones'),
        data: [datos.co2A, datos.co2B],
        backgroundColor: ['#c9c1ae', datos.variationCo2 > 0 ? '#c0392b' : '#17705b'],
        barPercentage: 0.5,
        categoryPercentage: 0.8,
        maxBarThickness: 72
      }]
    };
  });

  opcionesComparacion = computed<ChartConfiguration<'bar'>['options']>(() => {
    const etiqueta = this.idiomaService.t('Emisiones');
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: contexto => `${etiqueta}: ${this.numero(Number(contexto.parsed.y))} kg CO₂` } }
      },
      scales: {
        x: { grid: { display: false }, border: { color: '#c9c1ae' }, ticks: { color: '#0e2a2b', font: FUENTE_CIFRAS } },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: '#ece6d8' },
          ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, maxTicksLimit: 5, callback: valor => `${valor} kg` }
        }
      }
    };
  });

  constructor() {
    // Al llegar los cálculos, se preselecciona el primer área que tenga al menos dos fechas para comparar.
    effect(() => {
      if (this.idElegido() === 0 && this.huellas().length > 0) {
        this.preseleccionar();
      }
    });
  }

  ngOnInit(): void {
    forkJoin({
      area: this.carbonFootprintService.emisionesPorArea().pipe(catchError(err => of(this.fallo<EmisionArea>(err)))),
      sede: this.carbonFootprintService.emisionesPorSede().pipe(catchError(err => of(this.fallo<EmisionSede>(err))))
    }).subscribe(resultado => {
      this.porArea.set(Array.isArray(resultado.area) ? { datos: resultado.area, error: '' } : resultado.area);
      this.porSede.set(Array.isArray(resultado.sede) ? { datos: resultado.sede, error: '' } : resultado.sede);
      this.cargando.set(false);
    });
  }

  cambiarAlcance(alcance: Alcance): void {
    this.alcance.set(alcance);
    this.idElegido.set(this.opcionesAlcance()[0]?.id ?? 0);
    this.ajustarPeriodo();
  }

  cambiarElegido(id: number): void {
    this.idElegido.set(id);
    this.ajustarPeriodo();
  }

  cambiarPeriodo(periodo: string): void {
    this.periodo.set(periodo);
    this.ajustarFechas();
  }

  comparar(): void {
    if (!this.puedeComparar()) {
      return;
    }
    const alcance = this.alcance() === 'area' ? { idDepartment: this.idElegido() } : { idBranch: this.idElegido() };
    this.comparando.set(true);
    this.errorComparacion.set('');
    this.carbonFootprintService.comparar(alcance, this.periodo(), this.fechaA(), this.fechaB()).subscribe({
      next: datos => {
        this.comparacion.set(datos);
        this.comparando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.comparacion.set(null);
        this.comparando.set(false);
        this.errorComparacion.set(err.status === 404
          ? 'No existe un cálculo de huella para alguna de las fechas elegidas.'
          : err.status === 403 ? 'No tienes acceso a esta consulta.' : 'No se pudo comparar la huella.');
      }
    });
  }

  tendencia(datos: ComparacionHuella): 'sube' | 'baja' | 'igual' {
    return datos.variationCo2 > 0 ? 'sube' : datos.variationCo2 < 0 ? 'baja' : 'igual';
  }

  private preseleccionar(): void {
    const conDosFechas = (alcance: Alcance) => {
      const grupos = new Map<string, Set<string>>();
      for (const h of this.huellas()) {
        const clave = `${alcance === 'area' ? h.idDepartment : h.idBranch}|${h.timePeriod}`;
        grupos.set(clave, (grupos.get(clave) ?? new Set()).add(h.calculationDate));
      }
      return [...grupos.entries()].find(([, fechas]) => fechas.size >= 2)?.[0];
    };
    const clave = conDosFechas('area') ?? conDosFechas('sede');
    if (clave) {
      const [id, periodo] = clave.split('|');
      this.alcance.set(conDosFechas('area') ? 'area' : 'sede');
      this.idElegido.set(Number(id));
      this.periodo.set(periodo);
      this.ajustarFechas();
    } else {
      this.idElegido.set(this.opcionesAlcance()[0]?.id ?? 0);
      this.ajustarPeriodo();
    }
  }

  private ajustarPeriodo(): void {
    this.periodo.set(this.periodosDisponibles()[0] ?? '');
    this.ajustarFechas();
  }

  // Por defecto se compara la fecha anterior (A) con la más reciente (B).
  private ajustarFechas(): void {
    const fechas = this.fechasDisponibles();
    this.fechaB.set(fechas[fechas.length - 1] ?? '');
    this.fechaA.set(fechas.length >= 2 ? fechas[fechas.length - 2] : '');
    this.comparacion.set(null);
    this.errorComparacion.set('');
  }

  private datosBarras(barras: Barra[], color: string): ChartConfiguration<'bar'>['data'] {
    this.idiomaService.idioma();
    const valores = barras.map(b => (this.metrica() === 'co2' ? b.co2 : b.kwh));
    const maximo = Math.max(0, ...valores);
    return {
      labels: barras.map(b => b.nombre),
      datasets: [{
        label: this.idiomaService.t(this.metrica() === 'co2' ? 'Emisiones' : 'Consumo'),
        data: valores.map(v => Number(v.toFixed(2))),
        // El valor más alto se resalta en ámbar, como en el resto de gráficos.
        backgroundColor: valores.map(v => (maximo > 0 && v === maximo ? '#f2b53c' : color)),
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        maxBarThickness: 72
      }]
    };
  }

  private opcionesBarras(horizontal: boolean): ChartConfiguration<'bar'>['options'] {
    const unidad = this.metrica() === 'co2' ? 'kg CO₂' : 'kWh';
    const etiqueta = this.idiomaService.t(this.metrica() === 'co2' ? 'Emisiones' : 'Consumo');
    const ejeValor = {
      beginAtZero: true,
      border: { display: false },
      grid: { color: '#ece6d8' },
      ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, maxTicksLimit: 5 }
    };
    const ejeNombre = { grid: { display: false }, border: { color: '#c9c1ae' }, ticks: { color: '#0e2a2b', font: { size: 12 } } };
    return {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: contexto => `${etiqueta}: ${this.numero(Number(horizontal ? contexto.parsed.x : contexto.parsed.y))} ${unidad}`
          }
        }
      },
      scales: horizontal ? { x: ejeValor, y: ejeNombre } : { x: ejeNombre, y: ejeValor }
    };
  }

  private numero(valor: number): string {
    return valor.toLocaleString(this.idiomaService.idioma() === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private fechaCorta(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private fallo<T>(err: HttpErrorResponse): Fuente<T> {
    return { datos: [], error: err.status === 403 ? 'No tienes acceso a esta consulta.' : 'No se pudo cargar esta consulta.' };
  }
}
