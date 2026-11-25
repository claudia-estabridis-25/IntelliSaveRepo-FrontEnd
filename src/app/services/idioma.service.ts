import { DOCUMENT, Inject, Injectable, signal } from '@angular/core';
import { Idioma } from '../models/idioma';

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
