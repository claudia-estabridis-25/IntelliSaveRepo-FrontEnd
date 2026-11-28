import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { IdiomaService } from '../services/idioma.service';

@Injectable()
export class PaginadorIntl extends MatPaginatorIntl {
  private idiomaService = inject(IdiomaService);

  constructor() {
    super();
    effect(() => {
      this.idiomaService.idioma();
      this.traducir();
      this.changes.next();
    });
  }

  private traducir(): void {
    const t = (texto: string, valores: unknown[] = []) => this.idiomaService.t(texto, valores);
    this.itemsPerPageLabel = t('Filas por página');
    this.nextPageLabel = t('Página siguiente');
    this.previousPageLabel = t('Página anterior');
    this.firstPageLabel = t('Primera página');
    this.lastPageLabel = t('Última página');
    this.getRangeLabel = (pagina: number, tamano: number, total: number) => {
      if (total === 0) {
        return t('0 de {0}', [0]);
      }
      const inicio = pagina * tamano;
      const fin = Math.min(inicio + tamano, total);
      return t('{0} – {1} de {2}', [inicio + 1, fin, total]);
    };
  }
}