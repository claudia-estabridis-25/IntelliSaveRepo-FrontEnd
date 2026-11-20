import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TariffService } from '../../services/tariff.service';
import { LoginService } from '../../services/login.service';
import { Tariff } from '../../models/tariff';

@Component({
  selector: 'app-tarifa-listar',
  imports: [MatTableModule, MatButtonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './tarifa-listar.html',
  styleUrl: './tarifa-listar.css'
})
export class TarifaListar implements OnInit {
  tarifas = signal<Tariff[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  esAdmin = false;
  hoy = new Date().toISOString().slice(0, 10);
  columnas = ['sede', 'proveedor', 'vigencia', 'costo', 'estado', 'acciones'];

  ordenadas = computed(() =>
    [...this.tarifas()].sort((a, b) =>
      a.nameBranch.localeCompare(b.nameBranch) || b.initialEffectiveDate.localeCompare(a.initialEffectiveDate)
    )
  );

  constructor(private tariffService: TariffService, private loginService: LoginService) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.tariffService.listar().subscribe({
      next: datos => {
        this.tarifas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de tarifas.');
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

  eliminar(tarifa: Tariff): void {
    if (!confirm(`¿Eliminar la tarifa de ${tarifa.nameBranch} (${tarifa.initialEffectiveDate} a ${tarifa.endEffectiveDate})?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.tariffService.eliminar(tarifa.idTariff).subscribe({
      next: () => {
        this.tarifas.update(lista => lista.filter(t => t.idTariff !== tarifa.idTariff));
        this.mensaje.set(`Se eliminó la tarifa de ${tarifa.nameBranch}.`);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.error.set('No tienes acceso para eliminar esta tarifa.');
        } else if (err.status === 409) {
          this.error.set('No se puede eliminar la tarifa porque ya tiene consumos registrados con ella.');
        } else {
          this.error.set('No se pudo eliminar la tarifa.');
        }
      }
    });
  }
}
