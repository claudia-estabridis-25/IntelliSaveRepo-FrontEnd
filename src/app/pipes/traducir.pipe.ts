import { Pipe, PipeTransform, inject } from '@angular/core';
import { IdiomaService } from '../services/idioma.service';

// HU162: {{ 'Texto en español' | t }} o {{ 'Hay {0} sedes' | t: [total] }}.
// Es impuro para que se vuelva a evaluar cuando cambia el idioma (el idioma es un signal).
@Pipe({ name: 't', pure: false })
export class TraducirPipe implements PipeTransform {
  private idiomaService = inject(IdiomaService);

  transform(texto: string | null | undefined, valores: unknown[] = []): string {
    return this.idiomaService.t(texto ?? '', valores);
  }
}
