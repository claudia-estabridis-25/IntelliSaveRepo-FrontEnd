import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { LoginService } from '../../services/login.service';
import { ConsumptionRecordService } from '../../services/consumption-record.service';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { AlertService } from '../../services/alert.service';
import { TariffService } from '../../services/tariff.service';
import { CarbonFootprintService } from '../../services/carbon-footprint.service';
import { ReportService } from '../../services/report.service';
import { CompanyService } from '../../services/company.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Usuario } from '../../models/usuario';
import { ConsumptionRecord } from '../../models/consumption-record';
import { Equipment } from '../../models/equipment';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { Alert } from '../../models/alert';
import { Tariff } from '../../models/tariff';
import { CarbonFootprint } from '../../models/carbon-footprint';
import { Company } from '../../models/company';
import { ConsumoElevado, ConteoAlertas, ConteoSector } from '../../models/estadisticas';
import { ESTADOS_ALERTA, PRIORIDADES_ALERTA } from '../../models/alert';

type Periodo = 'mes' | 'anterior' | 'treinta';

// HU042: cada rol ve un resumen distinto al iniciar sesión.
type Vista = 'plataforma' | 'gestion' | 'empleado';

interface Rango {
  desde: string;
  hasta: string;
}

interface Pendiente {
  titulo: string;
  detalle: string;
  enlace: string;
  textoEnlace: string;
  color: 'rojo' | 'ambar';
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORES_TIPO = ['#0e2a2b', '#17705b', '#f2b53c', '#c9c1ae'];
const FACTOR_REFERENCIA = 0.52;
const COLORES_PRIORIDAD: Record<string, string> = { Alta: '#c0392b', Media: '#f2b53c', Baja: '#17705b' };
const FUENTE_CIFRAS = { family: 'IBM Plex Mono', size: 11 };

// El backend solo devuelve las categorías que tienen alertas: el resto se muestra en cero.
function completarConteo(conteo: ConteoAlertas[], categorias: string[]): { categoria: string; total: number }[] {
  const mapa = new Map(conteo.map(item => [item.category, item.totalAlerts]));
  const extra = conteo.map(item => item.category).filter(categoria => !categorias.includes(categoria));
  return [...categorias, ...extra].map(categoria => ({ categoria, total: mapa.get(categoria) ?? 0 }));
}

function fechaLocal(fecha: Date): string {
  const copia = new Date(fecha);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 10);
}

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return fechaLocal(new Date(anio, mes - 1, dia + dias));
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, DecimalPipe, BaseChartDirective, TraducirPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private idiomaService = inject(IdiomaService);
  perfil = signal<Usuario | null>(null);
  vista = signal<Vista>('empleado');
  registros = signal<ConsumptionRecord[]>([]);
  equipos = signal<Equipment[]>([]);
  areas = signal<Department[]>([]);
  sedes = signal<Branch[]>([]);
  alertas = signal<Alert[]>([]);
  tarifas = signal<Tariff[]>([]);
  huellas = signal<CarbonFootprint[]>([]);
  idSede = signal(0);
  periodo = signal<Periodo>('mes');
  cargando = signal(true);
  descargando = signal(false);
  error = signal('');
  actualizado = new Date();
  puedeGestionar = false;
  hoy = fechaLocal(new Date());

  // HU042 CA01: administrador de la plataforma
  empresas = signal<Company[]>([]);
  conteoSectores = signal<ConteoSector[]>([]);

  sectores = computed(() => [...this.conteoSectores()].sort((a, b) => b.totalCompanies - a.totalCompanies));

  graficoSectores = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: this.sectores().map(s => this.idiomaService.t(s.sectorCompany)),
    datasets: [{
      label: this.idiomaService.t('Empresas'),
      data: this.sectores().map(s => s.totalCompanies),
      backgroundColor: '#17705b',
      borderRadius: 0,
      barPercentage: 0.7
    }]
  }));

  opcionesConteo: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#ece6d8' },
        ticks: { color: '#5f7a72', font: FUENTE_CIFRAS, precision: 0 }
      },
      y: {
        grid: { display: false },
        border: { color: '#c9c1ae' },
        ticks: { color: '#0e2a2b', font: { size: 12 } }
      }
    }
  };

  // HU042 CA02: administrador de empresa y supervisor
  conteoEstado = signal<ConteoAlertas[]>([]);
  conteoPrioridad = signal<ConteoAlertas[]>([]);
  sinAccesoConteos = signal(false);
  idArea = signal(0);
  elevados = signal<ConsumoElevado[]>([]);
  cargandoElevados = signal(false);
  errorElevados = signal('');

  alertasPorEstado = computed(() => completarConteo(this.conteoEstado(), ESTADOS_ALERTA));
  alertasPorPrioridad = computed(() => completarConteo(this.conteoPrioridad(), PRIORIDADES_ALERTA));
  totalAlertas = computed(() => this.alertasPorEstado().reduce((suma, item) => suma + item.total, 0));
  resumenPrioridad = computed(() => this.alertasPorPrioridad().map(p => `${this.idiomaService.t(p.categoria)} ${p.total}`).join(', '));

  graficoPrioridad = computed<ChartConfiguration<'bar'>['data']>(() => {
    const datos = this.alertasPorPrioridad();
    return {
      labels: datos.map(d => this.idiomaService.t(d.categoria)),
      datasets: [{
        label: this.idiomaService.t('Alertas'),
        data: datos.map(d => d.total),
        backgroundColor: datos.map(d => COLORES_PRIORIDAD[d.categoria] ?? '#c9c1ae'),
        borderRadius: 0,
        barPercentage: 0.7
      }]
    };
  });

  // El selector de área respeta la sede elegida en la cabecera.
  areasDeSede = computed(() => this.areas().filter(area => this.idSede() === 0 || area.idBranch === this.idSede()));

  elevadosOrdenados = computed(() =>
    [...this.elevados()].sort((a, b) =>
      Number(b.elevatedConsumption) - Number(a.elevatedConsumption) || b.totalKwhConsumption - a.totalKwhConsumption)
  );

  // HU042 CA03: alertas sin atender que ve el empleado en su acceso directo.
  alertasAbiertas = computed(() =>
    this.alertas().filter(alerta => alerta.statusAlert === 'Pendiente' || alerta.statusAlert === 'En revisión').length
  );

  cantidadElevados = computed(() => this.elevados().filter(e => e.elevatedConsumption).length);

  rango = computed<Rango>(() => this.calcularRango(this.periodo(), 0));
  rangoAnterior = computed<Rango>(() => this.calcularRango(this.periodo(), 1));

  titulo = computed(() => {
    const [anio, mes] = this.hoy.split('-').map(Number);
    if (this.periodo() === 'mes') {
      return this.idiomaService.t('{0}, hasta hoy', [this.mayuscula(this.mes(mes - 1))]);
    }
    if (this.periodo() === 'anterior') {
      const fecha = new Date(anio, mes - 2, 1);
      return `${this.mayuscula(this.mes(fecha.getMonth()))} ${fecha.getFullYear()}`;
    }
    return this.idiomaService.t('Últimos 30 días');
  });

  subtitulo = computed(() => {
    const datos = this.perfil();
    const empresa = datos?.nameCompany ?? this.idiomaService.t('Todas las empresas');
    if (!this.puedeGestionar) {
      return [empresa, datos?.nameBranch, datos?.nameDepartment].filter(parte => !!parte).join(' · ');
    }
    const sede = this.sedes().find(s => s.idBranch === this.idSede());
    return `${empresa} · ${sede ? sede.nameBranch : this.idiomaService.t('Todas las sedes')}`;
  });

  equiposPorId = computed(() => new Map(this.equipos().map(equipo => [equipo.idEquipment, equipo])));
  areasPorId = computed(() => new Map(this.areas().map(area => [area.idDepartment, area])));

  private sedeDeEquipo(idEquipment: number): number | undefined {
    const equipo = this.equiposPorId().get(idEquipment);
    return equipo ? this.areasPorId().get(equipo.idDepartment)?.idBranch : undefined;
  }

  private filtrar(rango: Rango): ConsumptionRecord[] {
    return this.registros().filter(registro => {
      const dia = registro.dateTimeRecord.slice(0, 10);
      return dia >= rango.desde && dia <= rango.hasta &&
        (this.idSede() === 0 || this.sedeDeEquipo(registro.idEquipment) === this.idSede());
    });
  }

  delPeriodo = computed(() => this.filtrar(this.rango()));
  delAnterior = computed(() => this.filtrar(this.rangoAnterior()));

  totalKwh = computed(() => this.delPeriodo().reduce((suma, r) => suma + r.kwhConsumption, 0));
  totalCosto = computed(() => this.delPeriodo().reduce((suma, r) => suma + r.costTotal, 0));
  totalAnterior = computed(() => this.delAnterior().reduce((suma, r) => suma + r.kwhConsumption, 0));
  diferencia = computed(() => this.totalKwh() - this.totalAnterior());

  nombreAnterior = computed(() => {
    if (this.periodo() === 'treinta') {
      return this.idiomaService.t('los 30 días anteriores');
    }
    const [anio, mes] = this.rangoAnterior().desde.split('-').map(Number);
    return this.periodo() === 'mes' ? this.idiomaService.t('{0} a esta fecha', [this.mes(mes - 1)]) : `${this.mes(mes - 1)} ${anio}`;
  });

  dias = computed(() => {
    const porDia = new Map<string, number>();
    for (const registro of this.delPeriodo()) {
      const dia = registro.dateTimeRecord.slice(0, 10);
      porDia.set(dia, (porDia.get(dia) ?? 0) + registro.kwhConsumption);
    }
    const lista: { dia: string; kwh: number }[] = [];
    for (let dia = this.rango().desde; dia <= this.rango().hasta; dia = sumarDias(dia, 1)) {
      lista.push({ dia, kwh: porDia.get(dia) ?? 0 });
    }
    return lista;
  });

  pico = computed(() => this.dias().reduce((max, d) => (d.kwh > max.kwh ? d : max), { dia: '', kwh: 0 }));
  promedio = computed(() => (this.dias().length > 0 ? this.totalKwh() / this.dias().length : 0));

  grafico = computed<ChartConfiguration<'bar' | 'line'>['data']>(() => {
    const dias = this.dias();
    const pico = this.pico().dia;
    return {
      labels: dias.map(d => this.fechaCorta(d.dia)),
      datasets: [
        {
          type: 'bar',
          label: this.idiomaService.t('Consumo'),
          data: dias.map(d => Number(d.kwh.toFixed(2))),
          backgroundColor: dias.map(d => (d.dia === pico ? '#f2b53c' : '#17705b')),
          borderRadius: 0,
          barPercentage: 0.75,
          categoryPercentage: 0.9
        },
        {
          type: 'line',
          label: this.idiomaService.t('Promedio'),
          data: dias.map(() => Number(this.promedio().toFixed(2))),
          borderColor: '#9fb3ab',
          borderWidth: 1,
          borderDash: [3, 5],
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ]
    };
  });

  opciones: ChartConfiguration<'bar' | 'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: contexto => `${contexto.dataset.label}: ${Number(contexto.parsed.y).toFixed(2)} kWh`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: '#c9c1ae' },
        ticks: { color: '#5f7a72', font: { family: 'IBM Plex Mono', size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#ece6d8' },
        ticks: { color: '#5f7a72', font: { family: 'IBM Plex Mono', size: 11 }, maxTicksLimit: 5, callback: valor => `${valor} kWh` }
      }
    }
  };

  porArea = computed(() => {
    const total = this.totalKwh();
    const grupos = new Map<number, { nombre: string; kwh: number; costo: number }>();
    for (const registro of this.delPeriodo()) {
      const idArea = this.equiposPorId().get(registro.idEquipment)?.idDepartment;
      if (idArea === undefined) {
        continue;
      }
      const grupo = grupos.get(idArea) ?? { nombre: this.areasPorId().get(idArea)?.nameDepartment ?? this.idiomaService.t('Área {0}', [idArea]), kwh: 0, costo: 0 };
      grupo.kwh += registro.kwhConsumption;
      grupo.costo += registro.costTotal;
      grupos.set(idArea, grupo);
    }
    return [...grupos.entries()]
      .map(([idArea, grupo]) => ({
        ...grupo,
        parte: total > 0 ? (grupo.kwh / total) * 100 : 0,
        equipos: this.equipos().filter(equipo => equipo.idDepartment === idArea).length
      }))
      .sort((a, b) => b.kwh - a.kwh);
  });

  porTipo = computed(() => {
    const total = this.totalKwh();
    const grupos = new Map<string, number>();
    for (const registro of this.delPeriodo()) {
      const categoria = this.equiposPorId().get(registro.idEquipment)?.categoryEquipment ?? 'Otros';
      grupos.set(categoria, (grupos.get(categoria) ?? 0) + registro.kwhConsumption);
    }
    const ordenados = [...grupos.entries()].sort((a, b) => b[1] - a[1]);
    const principales = ordenados.slice(0, 3);
    const otros = ordenados.slice(3).reduce((suma, [, kwh]) => suma + kwh, 0);
    if (otros > 0) {
      principales.push(['Otros', otros]);
    }
    return principales.map(([nombre, kwh], indice) => ({
      nombre,
      parte: total > 0 ? (kwh / total) * 100 : 0,
      color: COLORES_TIPO[indice]
    }));
  });

  factor = computed(() => {
    const ultima = [...this.huellas()].sort((a, b) => b.calculationDate.localeCompare(a.calculationDate))[0];
    return ultima?.emissionFactor ?? FACTOR_REFERENCIA;
  });

  huellaPeriodo = computed(() => this.totalKwh() * this.factor());

  pendientes = computed<Pendiente[]>(() => {
    const orden: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };
    const items: Pendiente[] = this.alertas()
      .filter(alerta => alerta.statusAlert === 'Pendiente' || alerta.statusAlert === 'En revisión')
      .filter(alerta => this.idSede() === 0 || this.areasPorId().get(alerta.idDepartment)?.idBranch === this.idSede())
      .sort((a, b) => (orden[a.priorityLevelAlert] ?? 3) - (orden[b.priorityLevelAlert] ?? 3) || b.dateTimeAlert.localeCompare(a.dateTimeAlert))
      .slice(0, 3)
      .map(alerta => ({
        titulo: `${this.idiomaService.t(alerta.typeAlert)}: ${alerta.nameEquipment}`,
        detalle: this.idiomaService.t('{0} · {1} kWh · prioridad {2}', [alerta.nameDepartment, alerta.kwhDetected.toFixed(1), this.idiomaService.t(alerta.priorityLevelAlert).toLowerCase()]),
        enlace: '/alertas',
        textoEnlace: this.idiomaService.t('Ver alertas'),
        color: alerta.priorityLevelAlert === 'Alta' ? 'rojo' : 'ambar'
      }));

    if (this.puedeGestionar) {
      const limite = sumarDias(this.hoy, 10);
      const sedes = this.sedes().filter(sede => this.idSede() === 0 || sede.idBranch === this.idSede());
      for (const sede of sedes) {
        const deLaSede = this.tarifas().filter(tarifa => tarifa.idBranch === sede.idBranch);
        const vigente = deLaSede.find(t => t.initialEffectiveDate <= this.hoy && t.endEffectiveDate >= this.hoy);
        if (!vigente) {
          items.push({
            titulo: this.idiomaService.t('{0} no tiene tarifa vigente', [sede.nameBranch]),
            detalle: this.idiomaService.t('Sin tarifa no se puede calcular el costo de los consumos'),
            enlace: '/tarifas/nueva',
            textoEnlace: this.idiomaService.t('Registrar tarifa'),
            color: 'rojo'
          });
        } else if (vigente.endEffectiveDate <= limite && !deLaSede.some(t => t.initialEffectiveDate > vigente.endEffectiveDate)) {
          const [, mes, dia] = vigente.endEffectiveDate.split('-').map(Number);
          items.push({
            titulo: this.idiomaService.t('La tarifa de {0} vence el {1} de {2}', [sede.nameBranch, dia, this.mes(mes - 1)]),
            detalle: this.idiomaService.t('Registra la siguiente para que los costos sigan calculándose'),
            enlace: '/tarifas',
            textoEnlace: this.idiomaService.t('Ir a tarifas'),
            color: 'ambar'
          });
        }
      }
    }
    return items;
  });

  constructor(
    private loginService: LoginService,
    private consumptionRecordService: ConsumptionRecordService,
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private alertService: AlertService,
    private tariffService: TariffService,
    private carbonFootprintService: CarbonFootprintService,
    private reportService: ReportService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.loginService.tieneRol('ADMIN') || this.loginService.tieneRol('SUPERVISOR');

    this.loginService.perfilActual().subscribe(perfil => {
      this.perfil.set(perfil);
      if (this.loginService.esAdminPlataforma(perfil)) {
        this.vista.set('plataforma');
        this.cargarPlataforma();
      } else {
        this.vista.set(this.puedeGestionar ? 'gestion' : 'empleado');
        this.cargarEmpresa();
      }
    });
  }

  // HU042 CA01: total de empresas y cantidad por sector.
  private cargarPlataforma(): void {
    forkJoin({
      empresas: this.companyService.listar().pipe(catchError(() => of([] as Company[]))),
      sectores: this.companyService.contarPorSector().pipe(catchError(() => of([] as ConteoSector[])))
    }).subscribe(datos => {
      this.empresas.set(datos.empresas);
      this.conteoSectores.set(datos.sectores);
      this.actualizado = new Date();
      this.cargando.set(false);
    });
  }

  private cargarEmpresa(): void {
    const gestion = this.vista() === 'gestion';
    const conteo = (fuente: Observable<ConteoAlertas[]>) => fuente.pipe(catchError(() => {
      this.sinAccesoConteos.set(true);
      return of([] as ConteoAlertas[]);
    }));

    forkJoin({
      registros: this.consumptionRecordService.listar(),
      equipos: this.equipmentService.listar().pipe(catchError(() => of([] as Equipment[]))),
      areas: this.departmentService.listar().pipe(catchError(() => of([] as Department[]))),
      sedes: this.branchService.listar().pipe(catchError(() => of([] as Branch[]))),
      alertas: this.alertService.listar().pipe(catchError(() => of([] as Alert[]))),
      tarifas: gestion ? this.tariffService.listar().pipe(catchError(() => of([] as Tariff[]))) : of([] as Tariff[]),
      huellas: gestion ? this.carbonFootprintService.listar().pipe(catchError(() => of([] as CarbonFootprint[]))) : of([] as CarbonFootprint[]),
      porEstado: gestion ? conteo(this.alertService.contarPorEstado()) : of([] as ConteoAlertas[]),
      porPrioridad: gestion ? conteo(this.alertService.contarPorPrioridad()) : of([] as ConteoAlertas[])
    }).subscribe({
      next: datos => {
        this.registros.set(datos.registros);
        this.equipos.set(datos.equipos);
        this.areas.set(datos.areas);
        this.sedes.set(datos.sedes);
        this.alertas.set(datos.alertas);
        this.tarifas.set(datos.tarifas);
        this.huellas.set(datos.huellas);
        this.conteoEstado.set(datos.porEstado);
        this.conteoPrioridad.set(datos.porPrioridad);
        this.actualizado = new Date();
        this.cargando.set(false);
        if (gestion) {
          // Por defecto, el área del propio usuario; si no está en la lista, la primera.
          const propia = this.perfil()?.idDepartment;
          const inicial = datos.areas.find(area => area.idDepartment === propia) ?? datos.areas[0];
          if (inicial) {
            this.seleccionarArea(inicial.idDepartment);
          }
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos del dashboard.');
        this.cargando.set(false);
      }
    });
  }

  // HU042 CA02: equipos con consumo elevado del área. Un 404 significa que el área aún no tiene consumos.
  private seleccionarArea(idDepartment: number): void {
    this.idArea.set(idDepartment);
    this.elevados.set([]);
    this.errorElevados.set('');
    this.cargandoElevados.set(true);
    this.consumptionRecordService.consumoElevado(idDepartment).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of([] as ConsumoElevado[]) : throwError(() => err)))
    ).subscribe({
      next: lista => {
        if (this.idArea() === idDepartment) {
          this.elevados.set(lista);
          this.cargandoElevados.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (this.idArea() === idDepartment) {
          this.errorElevados.set(err.status === 403 ? 'No tienes acceso a los consumos de esta área.' : 'No se pudo consultar el consumo de los equipos.');
          this.cargandoElevados.set(false);
        }
      }
    });
  }

  cambiarArea(evento: Event): void {
    this.seleccionarArea(Number((evento.target as HTMLSelectElement).value));
  }

  cambiarSede(evento: Event): void {
    this.idSede.set(Number((evento.target as HTMLSelectElement).value));
    // Si el área elegida no pertenece a la nueva sede, pasa a la primera área de esa sede.
    if (this.vista() === 'gestion' && !this.areasDeSede().some(area => area.idDepartment === this.idArea())) {
      const primera = this.areasDeSede()[0];
      if (primera) {
        this.seleccionarArea(primera.idDepartment);
      } else {
        this.idArea.set(0);
        this.elevados.set([]);
        this.errorElevados.set('');
        this.cargandoElevados.set(false);
      }
    }
  }

  cambiarPeriodo(evento: Event): void {
    this.periodo.set((evento.target as HTMLSelectElement).value as Periodo);
  }

  descargarPdf(): void {
    const { desde, hasta } = this.rango();
    this.descargando.set(true);
    this.reportService.descargarPdf(desde, hasta, this.idSede() || null).subscribe({
      next: archivo => {
        this.descargando.set(false);
        this.reportService.guardarArchivo(archivo, `reporte-consumo-${desde}-a-${hasta}.pdf`);
      },
      error: (err: HttpErrorResponse) => {
        this.descargando.set(false);
        this.error.set(err.status === 403 ? 'No tienes acceso al reporte.' : 'No se pudo descargar el reporte.');
      }
    });
  }

  fechaCorta(dia: string): string {
    const [, mes, numero] = dia.split('-').map(Number);
    return `${numero} ${this.mes(mes - 1).slice(0, 3)}`;
  }

  // Nombre del mes en el idioma elegido (minúscula en español, como en el texto original).
  private mes(indice: number): string {
    return (this.idiomaService.idioma() === 'en' ? MESES_EN : MESES)[indice];
  }

  private calcularRango(periodo: Periodo, atras: number): Rango {
    const [anio, mes, dia] = this.hoy.split('-').map(Number);
    if (periodo === 'treinta') {
      const hasta = sumarDias(this.hoy, -30 * atras);
      return { desde: sumarDias(hasta, -29), hasta };
    }
    const desplazamiento = periodo === 'anterior' ? 1 + atras : atras;
    const inicio = new Date(anio, mes - 1 - desplazamiento, 1);
    const finDeMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
    if (periodo === 'mes') {
      const corte = new Date(inicio.getFullYear(), inicio.getMonth(), Math.min(dia, finDeMes.getDate()));
      return { desde: fechaLocal(inicio), hasta: fechaLocal(corte) };
    }
    return { desde: fechaLocal(inicio), hasta: fechaLocal(finDeMes) };
  }

  private mayuscula(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
