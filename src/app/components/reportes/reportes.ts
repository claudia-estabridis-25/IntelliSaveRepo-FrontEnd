import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReportService } from '../../services/report.service';
import { ConsumptionRecordService } from '../../services/consumption-record.service';
import { BranchService } from '../../services/branch.service';
import { ConsumptionReport, ReportItem } from '../../models/report';
import { Branch } from '../../models/branch';
import { ConsumoCategoria } from '../../models/estadisticas';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

function fechaLocal(fecha: Date): string {
  const copia = new Date(fecha);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 10);
}

function rangoValido(grupo: AbstractControl): ValidationErrors | null {
  const desde = grupo.get('desde')?.value;
  const hasta = grupo.get('hasta')?.value;
  return desde && hasta && hasta < desde ? { rangoInvalido: true } : null;
}

@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, NgTemplateOutlet, DatePipe, DecimalPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, TraducirPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  form: FormGroup;
  sedes = signal<Branch[]>([]);
  reporte = signal<ConsumptionReport | null>(null);
  categorias = signal<ReportItem[]>([]);
  errorCategorias = signal('');
  cargando = signal(false);
  descargando = signal('');
  error = signal('');
  hoy = fechaLocal(new Date());

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private consumptionRecordService: ConsumptionRecordService,
    private branchService: BranchService,
    private idiomaService: IdiomaService
  ) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    this.form = this.fb.group({
      desde: [fechaLocal(inicioMes), Validators.required],
      hasta: [this.hoy, Validators.required],
      idBranch: [0]
    }, { validators: rangoValido });
  }

  ngOnInit(): void {
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
    this.ver();
  }

  private filtros(): [string, string, number | null] {
    const { desde, hasta, idBranch } = this.form.value;
    return [desde, hasta, idBranch || null];
  }

  ver(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.cargarCategorias();
    this.reportService.obtener(...this.filtros()).subscribe({
      next: datos => {
        this.reporte.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.reporte.set(null);
        this.error.set(err.error?.message ?? this.idiomaService.t('No se pudo generar el reporte.'));
      }
    });
  }

  descargar(formato: 'pdf' | 'csv'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const [desde, hasta, idBranch] = this.filtros();
    const peticion: Observable<Blob> = formato === 'pdf'
      ? this.reportService.descargarPdf(desde, hasta, idBranch)
      : this.reportService.descargarCsv(desde, hasta, idBranch);

    this.descargando.set(formato);
    this.error.set('');
    peticion.subscribe({
      next: archivo => {
        this.descargando.set('');
        this.reportService.guardarArchivo(archivo, `reporte-consumo-${desde}-a-${hasta}.${formato}`);
      },
      error: async (err: HttpErrorResponse) => {
        this.descargando.set('');
        let mensaje = this.idiomaService.t('No se pudo descargar el reporte.');
        if (err.error instanceof Blob) {
          try {
            mensaje = JSON.parse(await err.error.text()).message ?? mensaje;
          } catch {
            mensaje = this.idiomaService.t('No se pudo descargar el reporte.');
          }
        }
        this.error.set(mensaje);
      }
    });
  }

  parte(item: ReportItem, total: number = this.reporte()?.totalKwh ?? 0): number {
    return total > 0 ? (item.totalKwh / total) * 100 : 0;
  }

  totalCategorias(): number {
    return this.categorias().reduce((suma, item) => suma + item.totalKwh, 0);
  }

  private cargarCategorias(): void {
    const { desde, hasta } = this.form.value;
    this.errorCategorias.set('');
    this.consumptionRecordService.consumoPorCategoria(desde, hasta).subscribe({
      next: datos => this.categorias.set(datos.map((fila: ConsumoCategoria, indice: number) => ({
        id: indice,
        name: fila.categoryEquipment,
        detail: this.idiomaService.t(fila.equipmentCount === 1 ? '{0} equipo' : '{0} equipos', [fila.equipmentCount]),
        recordCount: fila.totalRecords,
        totalKwh: fila.totalKwh,
        totalCost: fila.totalCost
      }))),
      error: () => {
        this.categorias.set([]);
        this.errorCategorias.set(this.idiomaService.t('No se pudo cargar el consumo por categoría.'));
      }
    });
  }
}