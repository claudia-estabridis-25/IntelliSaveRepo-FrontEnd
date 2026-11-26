import { DOCUMENT, Inject, Injectable, signal } from '@angular/core';
import { Idioma } from '../models/idioma';
import { EN } from '../i18n/traducciones';
import { EN_OPERACION } from '../i18n/traducciones-operacion';
import { EN_ANALISIS } from '../i18n/traducciones-analisis';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly clave = 'intellisave-idioma';
  readonly idioma = signal<Idioma>('es');

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.idioma.set(this.leer());
    this.document.documentElement.lang = this.idioma();
  }

  cambiar(idioma: Idioma): void {
    this.idioma.set(idioma);
    this.document.documentElement.lang = idioma;
    try {
      localStorage.setItem(this.clave, idioma);
    } catch {
      return;
    }
  }

  // HU162: traduce un texto de las pantallas internas. La clave es el texto en español.
  // Los marcadores {0}, {1}... se reemplazan por los valores en ambos idiomas.
  t(texto: string, valores: unknown[] = []): string {
    const base = this.idioma() === 'en' ? EN[texto] ?? EN_OPERACION[texto] ?? EN_ANALISIS[texto] ?? texto : texto;
    return valores.reduce<string>((resultado, valor, indice) => resultado.split(`{${indice}}`).join(String(valor ?? '')), base);
  }

  alternar(): void {
    this.cambiar(this.idioma() === 'es' ? 'en' : 'es');
  }

  private leer(): Idioma {
    try {
      return localStorage.getItem(this.clave) === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }
}
