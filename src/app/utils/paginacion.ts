import { computed, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

export class Paginacion<T> {
  readonly opciones = [5, 10, 20];
  readonly tamano = signal(10);
  private readonly pagina = signal(0);

  constructor(private fuente: () => T[]) {}

  readonly total = computed(() => this.fuente().length);

  readonly paginaActual = computed(() => {
    const ultima = Math.max(0, Math.ceil(this.total() / this.tamano()) - 1);
    return Math.min(this.pagina(), ultima);
  });

  readonly filas = computed(() => {
    const inicio = this.paginaActual() * this.tamano();
    return this.fuente().slice(inicio, inicio + this.tamano());
  });

  cambiar(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamano.set(evento.pageSize);
  }
}