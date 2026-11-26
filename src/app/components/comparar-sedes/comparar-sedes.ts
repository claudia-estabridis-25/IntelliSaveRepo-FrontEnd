import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { LoginService } from '../../services/login.service';
import { BranchService } from '../../services/branch.service';
import { CarbonFootprintService } from '../../services/carbon-footprint.service';
import { CompanyService } from '../../services/company.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Company } from '../../models/company';
import { ConsumoSede, EmisionSede } from '../../models/estadisticas';

type Pestana = 'consumo' | 'emisiones';
type MetricaConsumo = 'kwh' | 'costo' | 'registros';
type MetricaEmision = 'co2' | 'kwh' | 'calculos';

interface Metrica {
  etiqueta: string;
  unidad: string;
  decimales: number;
}

const METRICAS_CONSUMO: Record<MetricaConsumo, Metrica> = {
  kwh: { etiqueta: 'Consumo', unidad: 'kWh', decimales: 2 },
  costo: { etiqueta: 'Costo', unidad: 'S/', decimales: 2 },
  registros: { etiqueta: 'Registros', unidad: '', decimales: 0 }
};

const METRICAS_EMISION: Record<MetricaEmision, Metrica> = {
  co2: { etiqueta: 'Emisiones', unidad: 'kg CO₂', decimales: 2 },
  kwh: { etiqueta: 'Consumo', unidad: 'kWh', decimales: 2 },
  calculos: { etiqueta: 'Cálculos', unidad: '', decimales: 0 }
};

const COLOR_BARRA: Record<Pestana, string> = { consumo: '#17705b', emisiones: '#0e2a2b' };
const FUENTE_CIFRAS = { family: 'IBM Plex Mono', size: 11 };

function formatear(valor: number, metrica: Metrica, minimoDecimales = metrica.decimales): string {
  const numero = valor.toLocaleString('es-PE', { minimumFractionDigits: minimoDecimales, maximumFractionDigits: metrica.decimales });
  if (!metrica.unidad) {
    return numero;
  }
  return metrica.unidad === 'S/' ? `S/ ${numero}` : `${numero} ${metrica.unidad}`;
}

// Devuelve la clave en español del mensaje; la plantilla la traduce con el pipe t.
// textos = [sin acceso (403), no encontrado (404), cualquier otro error].
function mensajeError(err: HttpErrorResponse, textos: [string, string, string]): string {
  if (err.status === 403) {
    return textos[0];
  }
  return err.status === 404 ? textos[1] : textos[2];
}

const ERRORES_EMPRESAS: [string, string, string] = [
  'No tienes acceso a la lista de empresas.',
  'No se encontró la lista de empresas.',
  'No se pudo cargar la lista de empresas.'
];
const ERRORES_CONSUMO: [string, string, string] = [
  'No tienes acceso al consumo por sede.',
  'No se encontró el consumo por sede.',
  'No se pudo cargar el consumo por sede.'
];
const ERRORES_EMISIONES: [string, string, string] = [
  'No tienes acceso a las emisiones por sede.',
  'No se encontraron las emisiones por sede.',
  'No se pudieron cargar las emisiones por sede.'
];

// HU156 (consumo y costo por sede) y HU154 (emisiones de CO2 por sede).
@Component({
  selector: 'app-comparar-sedes',
  imports: [DecimalPipe, BaseChartDirective, TraducirPipe],
  templateUrl: './comparar-sedes.html',
  styleUrl: './comparar-sedes.css'
})
export class CompararSedes implements OnInit {
  private idiomaService = inject(IdiomaService);
  pestana = signal<Pestana>('consumo');
  esPlataforma = signal(false);
  cargandoPerfil = signal(true);

  // HU156: el administrador de la plataforma no tiene empresa, así que la elige en un selector.
  empresas = signal<Company[]>([]);
  idEmpresa = signal<number | null>(null);
  nombreEmpresa = signal('');

  consumos = signal<ConsumoSede[]>([]);
  cargandoConsumos = signal(false);
  errorConsumos = signal('');
  metricaConsumo = signal<MetricaConsumo>('kwh');

  emisiones = signal<EmisionSede[]>([]);
  cargandoEmisiones = signal(true);
  errorEmisiones = signal('');
  metricaEmision = signal<MetricaEmision>('co2');

  metricasConsumo = Object.entries(METRICAS_CONSUMO) as [MetricaConsumo, Metrica][];
  metricasEmision = Object.entries(METRICAS_EMISION) as [MetricaEmision, Metrica][];

  totalConsumo = computed(() => this.consumos().reduce(
    (total, sede) => ({
      registros: total.registros + sede.totalRecords,
      kwh: total.kwh + sede.totalKwh,
      costo: total.costo + sede.totalCost
    }),
    { registros: 0, kwh: 0, costo: 0 }
  ));

  totalEmision = computed(() => this.emisiones().reduce(
    (total, sede) => ({
      calculos: total.calculos + sede.totalCalculations,
      kwh: total.kwh + sede.totalKwh,
      co2: total.co2 + sede.totalCo2Emissions
    }),
    { calculos: 0, kwh: 0, co2: 0 }
  ));

  // Ordenadas de mayor a menor según la métrica que se está graficando.
  consumosOrdenados = computed(() => {
    const valor = this.valorConsumo(this.metricaConsumo());
    return [...this.consumos()].sort((a, b) => valor(b) - valor(a));
  });

  emisionesOrdenadas = computed(() => {
    const valor = this.valorEmision(this.metricaEmision());
    return [...this.emisiones()].sort((a, b) => valor(b) - valor(a));
  });

  graficoConsumo = computed<ChartConfiguration<'bar'>['data']>(() => {
    const metrica = this.metricaConsumo();
    const valor = this.valorConsumo(metrica);
    const sedes = this.consumosOrdenados();
    return this.datosGrafico(sedes.map(s => s.nameBranch), sedes.map(valor), METRICAS_CONSUMO[metrica], COLOR_BARRA.consumo);
  });

  graficoEmision = computed<ChartConfiguration<'bar'>['data']>(() => {
    const metrica = this.metricaEmision();
    const valor = this.valorEmision(metrica);
    const sedes = this.emisionesOrdenadas();
    return this.datosGrafico(sedes.map(s => s.nameBranch), sedes.map(valor), METRICAS_EMISION[metrica], COLOR_BARRA.emisiones);
  });

  nombreMetricaConsumo = computed(() => this.idiomaService.t(METRICAS_CONSUMO[this.metricaConsumo()].etiqueta).toLowerCase());
  nombreMetricaEmision = computed(() => this.idiomaService.t(METRICAS_EMISION[this.metricaEmision()].etiqueta).toLowerCase());

  opcionesConsumo = computed(() => this.opcionesGrafico(METRICAS_CONSUMO[this.metricaConsumo()]));
  opcionesEmision = computed(() => this.opcionesGrafico(METRICAS_EMISION[this.metricaEmision()]));

  constructor(
    private loginService: LoginService,
    private branchService: BranchService,
    private carbonFootprintService: CarbonFootprintService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.cargarEmisiones();
    this.loginService.perfilActual().subscribe(perfil => {
      this.cargandoPerfil.set(false);
      if (this.loginService.esAdminPlataforma(perfil)) {
        this.esPlataforma.set(true);
        this.companyService.listar().subscribe({
          next: empresas => {
            this.empresas.set(empresas);
            if (empresas.length > 0) {
              this.seleccionarEmpresa(empresas[0].idCompany);
            }
          },
          error: (err: HttpErrorResponse) => this.errorConsumos.set(mensajeError(err, ERRORES_EMPRESAS))
        });
      } else if (perfil?.idCompany) {
        this.nombreEmpresa.set(perfil.nameCompany ?? '');
        this.seleccionarEmpresa(perfil.idCompany);
      } else {
        this.errorConsumos.set('Tu usuario no está asociado a una empresa.');
      }
    });
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
  }

  cambiarEmpresa(evento: Event): void {
    this.seleccionarEmpresa(Number((evento.target as HTMLSelectElement).value));
  }

  cambiarMetricaConsumo(metrica: MetricaConsumo): void {
    this.metricaConsumo.set(metrica);
  }

  cambiarMetricaEmision(metrica: MetricaEmision): void {
    this.metricaEmision.set(metrica);
  }

  private seleccionarEmpresa(idCompany: number): void {
    this.idEmpresa.set(idCompany);
    if (this.esPlataforma()) {
      this.nombreEmpresa.set(this.empresas().find(e => e.idCompany === idCompany)?.comercialNamecompany ?? '');
    }
    this.consumos.set([]);
    this.errorConsumos.set('');
    this.cargandoConsumos.set(true);
    this.branchService.consumoPorSede(idCompany).subscribe({
      next: sedes => {
        if (this.idEmpresa() === idCompany) {
          this.consumos.set(sedes);
          this.cargandoConsumos.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (this.idEmpresa() === idCompany) {
          this.errorConsumos.set(mensajeError(err, ERRORES_CONSUMO));
          this.cargandoConsumos.set(false);
        }
      }
    });
  }

  private cargarEmisiones(): void {
    this.carbonFootprintService.emisionesPorSede().subscribe({
      next: sedes => {
        this.emisiones.set(sedes);
        this.cargandoEmisiones.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorEmisiones.set(mensajeError(err, ERRORES_EMISIONES));
        this.cargandoEmisiones.set(false);
      }
    });
  }

  private valorConsumo(metrica: MetricaConsumo): (sede: ConsumoSede) => number {
    if (metrica === 'costo') {
      return sede => sede.totalCost;
    }
    return metrica === 'registros' ? sede => sede.totalRecords : sede => sede.totalKwh;
  }

  private valorEmision(metrica: MetricaEmision): (sede: EmisionSede) => number {
    if (metrica === 'kwh') {
      return sede => sede.totalKwh;
    }
    return metrica === 'calculos' ? sede => sede.totalCalculations : sede => sede.totalCo2Emissions;
  }

  private datosGrafico(etiquetas: string[], valores: number[], metrica: Metrica, color: string): ChartConfiguration<'bar'>['data'] {
    const maximo = Math.max(0, ...valores);
    return {
      labels: etiquetas,
      datasets: [{
        label: this.idiomaService.t(metrica.etiqueta),
        data: valores.map(v => Number(v.toFixed(metrica.decimales))),
        // La sede con el valor más alto se resalta en ámbar.
        backgroundColor: valores.map(v => (maximo > 0 && v === maximo ? '#f2b53c' : color)),
        borderRadius: 0,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    };
  }

  private opcionesGrafico(metrica: Metrica): ChartConfiguration<'bar'>['options'] {
    const etiqueta = this.idiomaService.t(metrica.etiqueta);
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: contexto => `${etiqueta}: ${formatear(Number(contexto.parsed.y), metrica)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: '#c9c1ae' },
          ticks: { color: '#0e2a2b', font: { size: 12 }, maxRotation: 0, autoSkip: false }
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: '#ece6d8' },
          ticks: {
            color: '#5f7a72',
            font: FUENTE_CIFRAS,
            maxTicksLimit: 5,
            precision: metrica.decimales === 0 ? 0 : undefined,
            callback: valor => formatear(Number(valor), metrica, 0)
          }
        }
      }
    };
  }
}
