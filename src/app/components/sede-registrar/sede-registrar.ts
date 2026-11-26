import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import * as L from 'leaflet';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { BranchInsert } from '../../models/branch';
import { Company } from '../../models/company';
import { GeocodificacionService } from '../../services/geocodificacion.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { ATRIBUCION_OSM, CAPA_OSM, CENTRO_LIMA, iconoSede, tieneCoordenadas } from '../sede-mapa/icono-sede';

function coordenadasValidas(grupo: AbstractControl): ValidationErrors | null {
  const latitud = grupo.get('latitudeBranch')?.value;
  const longitud = grupo.get('longitudeBranch')?.value;
  return latitud === 0 && longitud === 0 ? { coordenadasCero: true } : null;
}

@Component({
  selector: 'app-sede-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, TraducirPipe],
  templateUrl: './sede-registrar.html',
  styleUrl: './sede-registrar.css'
})
export class SedeRegistrar implements OnInit, OnDestroy {
  form: FormGroup;
  idSede: number | null = null;
  empresas = signal<Company[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');

  // HU114: búsqueda de la ubicación con Nominatim
  buscando = signal(false);
  errorUbicacion = signal('');
  ubicacionEncontrada = signal('');

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private destroyRef = inject(DestroyRef);
  private geocodificacion = inject(GeocodificacionService);
  private idiomaService = inject(IdiomaService);

  // El contenedor del mapa aparece recién cuando termina de cargar la sede (bloque @if).
  @ViewChild('mapa') set contenedorMapa(elemento: ElementRef<HTMLDivElement> | undefined) {
    if (elemento && !this.mapa) {
      this.crearMapa(elemento.nativeElement);
    } else if (!elemento) {
      this.destruirMapa();
    }
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService,
    private companyService: CompanyService
  ) {
    this.form = this.fb.group({
      nameBranch: ['', [Validators.required, Validators.maxLength(30)]],
      idCompany: [null, Validators.required],
      addressBranch: ['', [Validators.required, Validators.maxLength(60)]],
      latitudeBranch: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitudeBranch: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      descriptionBranch: ['', [Validators.required, Validators.maxLength(90)]]
    }, { validators: coordenadasValidas });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idSede = Number(id);
      this.cargar(this.idSede);
    }

    this.companyService.listar().subscribe({
      next: datos => {
        this.empresas.set(datos);
        if (datos.length === 1 && !this.esEdicion) {
          this.form.patchValue({ idCompany: datos[0].idCompany });
        }
      },
      error: () => this.error.set(this.idiomaService.t('No se pudo cargar la lista de empresas.'))
    });

    // Si el usuario escribe las coordenadas a mano, el marcador se mueve también.
    merge(this.form.get('latitudeBranch')!.valueChanges, this.form.get('longitudeBranch')!.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sincronizarMarcador(false));
  }

  ngOnDestroy(): void {
    this.destruirMapa();
  }

  get esEdicion(): boolean {
    return this.idSede !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.branchService.listarPorId(id).subscribe({
      next: sede => {
        this.form.patchValue(sede);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.idiomaService.t(err.status === 403 ? 'No tienes acceso a esta sede.' : 'No se encontró la sede.'));
        this.cargando.set(false);
      }
    });
  }

  largo(campo: string): number {
    return this.form.get(campo)?.value?.length ?? 0;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set('');

    const sede: BranchInsert = { ...this.form.value, idBranch: this.idSede ?? 0 };
    const peticion = this.esEdicion
      ? this.branchService.modificar(sede)
      : this.branchService.registrar(sede);

    peticion.subscribe({
      next: guardada => {
        const mensaje = this.esEdicion ? 'Se actualizó la sede {0}.' : 'Se registró la sede {0}.';
        this.router.navigate(['/sedes'], { state: { mensaje: this.idiomaService.t(mensaje, [guardada.nameBranch]) } });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set(this.idiomaService.t('No tienes acceso para guardar sedes en esa empresa.'));
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? this.idiomaService.t('Revisa los datos del formulario.'));
        } else {
          this.error.set(this.idiomaService.t('No se pudo guardar la sede.'));
        }
      }
    });
  }

  buscarUbicacion(): void {
    const direccion = (this.form.get('addressBranch')?.value ?? '').trim();
    this.errorUbicacion.set('');
    this.ubicacionEncontrada.set('');
    if (!direccion) {
      this.form.get('addressBranch')?.markAsTouched();
      this.errorUbicacion.set(this.idiomaService.t('Escribe la dirección de la sede antes de buscar su ubicación.'));
      return;
    }

    this.buscando.set(true);
    const inicio = Date.now();
    // Nominatim permite 1 consulta por segundo: el botón sigue desactivado al menos ese tiempo.
    const terminar = () => setTimeout(() => this.buscando.set(false), Math.max(0, 1000 - (Date.now() - inicio)));

    this.geocodificacion.buscar(direccion).subscribe({
      next: ubicacion => {
        terminar();
        if (!ubicacion) {
          this.errorUbicacion.set(this.idiomaService.t('No se encontró la dirección "{0}". Revisa que esté bien escrita o marca el punto en el mapa.', [direccion]));
          return;
        }
        this.colocarCoordenadas(ubicacion.latitud, ubicacion.longitud);
        this.ubicacionEncontrada.set(ubicacion.nombre);
      },
      error: () => {
        terminar();
        this.errorUbicacion.set(this.idiomaService.t('No se pudo consultar el servicio de ubicación. Inténtalo en unos segundos.'));
      }
    });
  }

  private colocarCoordenadas(latitud: number, longitud: number, centrar = true): void {
    this.form.patchValue({
      latitudeBranch: Number(latitud.toFixed(6)),
      longitudeBranch: Number(longitud.toFixed(6))
    });
    this.form.get('latitudeBranch')?.markAsTouched();
    this.form.get('longitudeBranch')?.markAsTouched();
    this.form.markAsDirty();
    this.sincronizarMarcador(centrar);
  }

  private crearMapa(contenedor: HTMLDivElement): void {
    this.mapa = L.map(contenedor).setView(CENTRO_LIMA, 11);
    L.tileLayer(CAPA_OSM, { maxZoom: 19, attribution: ATRIBUCION_OSM }).addTo(this.mapa);

    // Clic en el mapa: ajusta el punto de la sede.
    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.ubicacionEncontrada.set('');
      this.colocarCoordenadas(evento.latlng.lat, evento.latlng.lng, false);
    });

    this.sincronizarMarcador(true, 16);
    // El contenedor se dibuja dentro del bloque @if; recalculamos su tamaño cuando ya está en pantalla.
    setTimeout(() => this.mapa?.invalidateSize());
  }

  private sincronizarMarcador(centrar: boolean, zoom?: number): void {
    if (!this.mapa) {
      return;
    }
    const latitud = this.form.get('latitudeBranch')?.value;
    const longitud = this.form.get('longitudeBranch')?.value;
    const valida = typeof latitud === 'number' && typeof longitud === 'number'
      && latitud >= -90 && latitud <= 90 && longitud >= -180 && longitud <= 180
      && tieneCoordenadas(latitud, longitud);

    if (!valida) {
      this.marcador?.remove();
      this.marcador = null;
      return;
    }

    const punto: L.LatLngTuple = [latitud, longitud];
    if (this.marcador) {
      this.marcador.setLatLng(punto);
    } else {
      this.marcador = L.marker(punto, { icon: iconoSede, draggable: true, title: this.idiomaService.t('Ubicación de la sede') }).addTo(this.mapa);
      this.marcador.on('dragend', () => {
        const posicion = this.marcador!.getLatLng();
        this.ubicacionEncontrada.set('');
        this.colocarCoordenadas(posicion.lat, posicion.lng, false);
      });
    }
    if (centrar) {
      this.mapa.setView(punto, zoom ?? Math.max(this.mapa.getZoom(), 16));
    }
  }

  private destruirMapa(): void {
    this.marcador = null;
    this.mapa?.remove();
    this.mapa = null;
  }
}
