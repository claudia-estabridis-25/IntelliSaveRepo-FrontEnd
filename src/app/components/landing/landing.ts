import { ChangeDetectionStrategy, Component, DOCUMENT, Inject, Signal, computed, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { IdiomaService } from '../../services/idioma.service';
import { Idioma } from '../../models/idioma';
import { TEXTOS } from './landing.textos';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Landing {
  readonly correoContacto = 'contacto@lumensave.pe';
  readonly imagenHero = '/landing/hero-ciudad.svg';
  readonly imagenesPasos = ['/landing/paso-organizacion.svg', '/landing/paso-horas.svg', '/landing/paso-revisa.svg'];
  readonly imagenesRoles = ['/landing/rol-admin.svg', '/landing/rol-supervisor.svg', '/landing/rol-empleado.svg'];
  readonly fondosRoles = ['#0e2a2b', '#17705b', '#f2b53c'];
  readonly iconos: Record<string, string[]> = {
    bolt: ['M13 2 L4 14 H11 L10 22 L20 9 H13 Z'],
    notifications: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z', 'M10 20a2 2 0 0 0 4 0'],
    trending_up: ['M3 17l5-5 4 3 8-8', 'M15 7h5v5'],
    cloud: ['M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 17 18Z'],
    eco: ['M5 19c0-8 6-14 15-14-1 9-7 15-15 14Z', 'M5 19l7-7'],
    description: ['M7 3h7l5 5v13H7Z', 'M14 3v5h5M10 13h6M10 17h6']
  };

  idioma: Signal<Idioma>;
  t = computed(() => TEXTOS[this.idioma()]);
  menuAbierto = signal(false);
  enviado = signal(false);
  sesionActiva: boolean;

  formulario: FormGroup<{
    nombre: FormControl<string>;
    empresa: FormControl<string>;
    correo: FormControl<string>;
    sedes: FormControl<number>;
  }>;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private fb: FormBuilder,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {
    this.idioma = this.idiomaService.idioma;
    this.sesionActiva = this.loginService.estaAutenticado();
    this.formulario = this.fb.nonNullable.group({
      nombre: ['', Validators.required],
      empresa: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      sedes: [0]
    });
  }

  cambiarIdioma(idioma: Idioma): void {
    this.idiomaService.cambiar(idioma);
  }

  alternarIdioma(): void {
    this.idiomaService.alternar();
  }

  alternarMenu(): void {
    this.menuAbierto.update(abierto => !abierto);
  }

  irA(evento: Event, id: string): void {
    evento.preventDefault();
    this.menuAbierto.set(false);
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  campoInvalido(campo: 'nombre' | 'empresa' | 'correo'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  solicitarDemo(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nombre, empresa, correo, sedes } = this.formulario.getRawValue();
    const textos = this.t().demo;
    const cuerpo = [
      `${textos.nombre}: ${nombre}`,
      `${textos.empresa}: ${empresa}`,
      `${textos.correo}: ${correo}`,
      `${textos.sedes}: ${textos.opcionesSedes[sedes]}`
    ].join('\n');
    const enlace = `mailto:${this.correoContacto}?subject=${encodeURIComponent(textos.asunto)}&body=${encodeURIComponent(cuerpo)}`;
    this.document.location.href = enlace;
    this.enviado.set(true);
    this.formulario.reset();
  }
}
