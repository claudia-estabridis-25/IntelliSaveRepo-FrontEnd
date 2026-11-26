import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TariffService } from '../../services/tariff.service';
import { Tariff } from '../../models/tariff';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-tarifa-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe, TraducirPipe],
  templateUrl: './tarifa-listar.html',
  styleUrl: './tarifa-listar.css'
})
export class TarifaListar implements OnInit {
  tarifas = signal<Tariff[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  hoy = new Date().toISOString().slice(0, 10);
  columnas = ['sede', 'proveedor', 'vigencia', 'costo', 'estado', 'acciones'];

  // HU137: filtro por sede ('' = todas).
  sedeFiltro = signal<number | ''>('');

  sedes = computed(() => {
    const unicas = new Map(this.tarifas().map(t => [t.idBranch, t.nameBranch]));
    return [...unicas].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  ordenadas = computed(() =>
    this.tarifas()
      .filter(t => this.sedeFiltro() === '' || t.idBranch === this.sedeFiltro())
      .sort((a, b) =>
        a.nameBranch.localeCompare(b.nameBranch) || b.initialEffectiveDate.localeCompare(a.initialEffectiveDate)
      )
  );

  constructor(
    private tariffService: TariffService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.tariffService.listar().subscribe({
      next: datos => {
        this.tarifas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de tarifas.'));
        this.cargando.set(false);
      }
    });
  }

  estado(tarifa: Tariff): string {
    if (tarifa.endEffectiveDate < this.hoy) {
      return 'Vencida';
    }
    return tarifa.initialEffectiveDate > this.hoy ? 'Próxima' : 'Vigente';
  }
}
