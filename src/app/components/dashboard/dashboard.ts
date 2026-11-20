import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
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
import { Usuario } from '../../models/usuario';
import { ConsumptionRecord } from '../../models/consumption-record';
import { Equipment } from '../../models/equipment';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { Alert } from '../../models/alert';
import { Tariff } from '../../models/tariff';
import { CarbonFootprint } from '../../models/carbon-footprint';

type Periodo = 'mes' | 'anterior' | 'treinta';

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
const COLORES_TIPO = ['#0e2a2b', '#17705b', '#f2b53c', '#c9c1ae'];
const FACTOR_REFERENCIA = 0.52;

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
  imports: [RouterLink, DatePipe, DecimalPipe, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  perfil = signal<Usuario | null>(null);
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

  rango = computed<Rango>(() => this.calcularRango(this.periodo(), 0));
  rangoAnterior = computed<Rango>(() => this.calcularRango(this.periodo(), 1));

  titulo = computed(() => {
    const [anio, mes] = this.hoy.split('-').map(Number);
    if (this.periodo() === 'mes') {
      return `${this.mayuscula(MESES[mes - 1])}, hasta hoy`;
    }
    if (this.periodo() === 'anterior') {
      const fecha = new Date(anio, mes - 2, 1);
      return `${this.mayuscula(MESES[fecha.getMonth()])} ${fecha.getFullYear()}`;
    }
    return 'Últimos 30 días';
  });

  subtitulo = computed(() => {
    const datos = this.perfil();
    const empresa = datos?.nameCompany ?? 'Todas las empresas';
    if (!this.puedeGestionar) {
      return [empresa, datos?.nameBranch, datos?.nameDepartment].filter(parte => !!parte).join(' · ');
    }
    const sede = this.sedes().find(s => s.idBranch === this.idSede());
    return `${empresa} · ${sede ? 'Sede ' + sede.nameBranch : 'Todas las sedes'}`;
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
      return 'los 30 días anteriores';
    }
    const [anio, mes] = this.rangoAnterior().desde.split('-').map(Number);
    return this.periodo() === 'mes' ? `${MESES[mes - 1]} a esta fecha` : `${MESES[mes - 1]} ${anio}`;
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
      labels: dias.map(d => `${Number(d.dia.slice(8))} ${MESES[Number(d.dia.slice(5, 7)) - 1].slice(0, 3)}`),
      datasets: [
        {
          type: 'bar',
          label: 'Consumo',
          data: dias.map(d => Number(d.kwh.toFixed(2))),
          backgroundColor: dias.map(d => (d.dia === pico ? '#f2b53c' : '#17705b')),
          borderRadius: 0,
          barPercentage: 0.75,
          categoryPercentage: 0.9
        },
        {
          type: 'line',
          label: 'Promedio',
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
      const grupo = grupos.get(idArea) ?? { nombre: this.areasPorId().get(idArea)?.nameDepartment ?? `Área ${idArea}`, kwh: 0, costo: 0 };
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
      .sort((a, b) => (orden[a.priorityLevelAlert] ?? 3) - (orden[b.priorityLevelAlert] ?? 3) || b.dateTimeAlert.localeCompare(a.dateTimeAlert))
      .slice(0, 3)
      .map(alerta => ({
        titulo: `${alerta.typeAlert}: ${alerta.nameEquipment}`,
        detalle: `${alerta.nameDepartment} · ${alerta.kwhDetected.toFixed(1)} kWh · prioridad ${alerta.priorityLevelAlert.toLowerCase()}`,
        enlace: '/alertas',
        textoEnlace: 'Ver alertas',
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
            titulo: `${sede.nameBranch} no tiene tarifa vigente`,
            detalle: 'Sin tarifa no se puede calcular el costo de los consumos',
            enlace: '/tarifas/nueva',
            textoEnlace: 'Registrar tarifa',
            color: 'rojo'
          });
        } else if (vigente.endEffectiveDate <= limite && !deLaSede.some(t => t.initialEffectiveDate > vigente.endEffectiveDate)) {
          const [, mes, dia] = vigente.endEffectiveDate.split('-').map(Number);
          items.push({
            titulo: `La tarifa de ${sede.nameBranch} vence el ${dia} de ${MESES[mes - 1]}`,
            detalle: 'Registra la siguiente para que los costos sigan calculándose',
            enlace: '/tarifas',
            textoEnlace: 'Ir a tarifas',
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
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.loginService.tieneRol('ADMIN') || this.loginService.tieneRol('SUPERVISOR');

    forkJoin({
      perfil: this.loginService.obtenerPerfil().pipe(catchError(() => of(null))),
      registros: this.consumptionRecordService.listar(),
      equipos: this.equipmentService.listar().pipe(catchError(() => of([] as Equipment[]))),
      areas: this.departmentService.listar().pipe(catchError(() => of([] as Department[]))),
      sedes: this.branchService.listar().pipe(catchError(() => of([] as Branch[]))),
      alertas: this.alertService.listar().pipe(catchError(() => of([] as Alert[]))),
      tarifas: this.puedeGestionar ? this.tariffService.listar().pipe(catchError(() => of([] as Tariff[]))) : of([] as Tariff[]),
      huellas: this.puedeGestionar ? this.carbonFootprintService.listar().pipe(catchError(() => of([] as CarbonFootprint[]))) : of([] as CarbonFootprint[])
    }).subscribe({
      next: datos => {
        this.perfil.set(datos.perfil);
        this.registros.set(datos.registros);
        this.equipos.set(datos.equipos);
        this.areas.set(datos.areas);
        this.sedes.set(datos.sedes);
        this.alertas.set(datos.alertas);
        this.tarifas.set(datos.tarifas);
        this.huellas.set(datos.huellas);
        this.actualizado = new Date();
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos del dashboard.');
        this.cargando.set(false);
      }
    });
  }

  cambiarSede(evento: Event): void {
    this.idSede.set(Number((evento.target as HTMLSelectElement).value));
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
    return `${numero} ${MESES[mes - 1].slice(0, 3)}`;
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
