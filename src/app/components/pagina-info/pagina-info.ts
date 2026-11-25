import { ChangeDetectionStrategy, Component, DOCUMENT, Inject, Signal, computed, effect, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { IdiomaService } from '../../services/idioma.service';
import { Idioma } from '../../models/idioma';
import { ClavePagina, TEXTOS_INFO } from './pagina-info.textos';

@Component({
  selector: 'app-pagina-info',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './pagina-info.html',
  styleUrl: './pagina-info.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginaInfo {
  readonly correoContacto = 'contacto@lumensave.pe';
  readonly clave = signal<ClavePagina>('nosotros');
  idioma: Signal<Idioma>;
  comunes = computed(() => TEXTOS_INFO[this.idioma()].comunes);
  pagina = computed(() => TEXTOS_INFO[this.idioma()].paginas[this.clave()]);
  esLegal = computed(() => this.clave() !== 'nosotros');

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private route: ActivatedRoute,
    private titulo: Title,
    private idiomaService: IdiomaService
  ) {
    this.idioma = this.idiomaService.idioma;
    this.clave.set(this.route.snapshot.data['pagina'] as ClavePagina);
    this.document.defaultView?.scrollTo(0, 0);
    effect(() => this.titulo.setTitle(this.pagina().tituloPestana));
  }

  cambiarIdioma(idioma: Idioma): void {
    this.idiomaService.cambiar(idioma);
  }

  alternarIdioma(): void {
    this.idiomaService.alternar();
  }

  irA(evento: Event, id: string): void {
    evento.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(parte => parte.charAt(0))
      .slice(0, 2)
      .join('');
  }
}
