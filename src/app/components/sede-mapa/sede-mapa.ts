import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Branch } from '../../models/branch';
import { ATRIBUCION_OSM, CAPA_OSM, CENTRO_LIMA, iconoSede, tieneCoordenadas } from './icono-sede';

type MarcadorSede = L.Marker & { idSede?: number };

@Component({
  selector: 'app-sede-mapa',
  imports: [RouterLink, TraducirPipe],
  templateUrl: './sede-mapa.html',
  styleUrl: './sede-mapa.css'
})
export class SedeMapa implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapa', { static: true }) contenedor!: ElementRef<HTMLDivElement>;

  sedes = signal<Branch[]>([]);
  empresas = signal<Map<number, string>>(new Map());
  cargando = signal(true);
  error = signal('');

  ubicadas = computed(() => this.sedes().filter(sede => tieneCoordenadas(sede.latitudeBranch, sede.longitudeBranch)));
  sinUbicar = computed(() => this.sedes().filter(sede => !tieneCoordenadas(sede.latitudeBranch, sede.longitudeBranch)));

  private mapa: L.Map | null = null;
  private capaMarcadores = L.featureGroup();

  constructor(private branchService: BranchService, private companyService: CompanyService, private idiomaService: IdiomaService) {}

  ngOnInit(): void {
    this.branchService.listar().subscribe({
      next: datos => {
        this.sedes.set(datos);
        this.cargando.set(false);
        this.dibujarMarcadores(true);
      },
      error: () => {
        this.error.set(this.idiomaService.t('No se pudo cargar la lista de sedes.'));
        this.cargando.set(false);
      }
    });
    this.companyService.listar().subscribe({
      next: datos => {
        this.empresas.set(new Map(datos.map(empresa => [empresa.idCompany, empresa.comercialNamecompany])));
        this.dibujarMarcadores(false);
      }
    });
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.contenedor.nativeElement).setView(CENTRO_LIMA, 11);
    L.tileLayer(CAPA_OSM, { maxZoom: 19, attribution: ATRIBUCION_OSM }).addTo(this.mapa);
    this.capaMarcadores.addTo(this.mapa);
    this.dibujarMarcadores(true);
    // El contenedor puede terminar de medirse después de que el layout lo pinte.
    setTimeout(() => {
      this.mapa?.invalidateSize();
      this.ajustarVista();
    });
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
    this.mapa = null;
  }

  centrarEn(sede: Branch): void {
    if (!this.mapa || !tieneCoordenadas(sede.latitudeBranch, sede.longitudeBranch)) {
      return;
    }
    this.mapa.setView([sede.latitudeBranch!, sede.longitudeBranch!], 16);
    this.capaMarcadores.eachLayer(capa => {
      const marcador = capa as MarcadorSede;
      if (marcador.idSede === sede.idBranch) {
        marcador.openPopup();
      }
    });
  }

  private dibujarMarcadores(ajustar: boolean): void {
    if (!this.mapa) {
      return;
    }
    this.capaMarcadores.clearLayers();
    const mostrarEmpresa = this.empresas().size > 1;

    for (const sede of this.ubicadas()) {
      const marcador: MarcadorSede = L.marker([sede.latitudeBranch!, sede.longitudeBranch!], { icon: iconoSede, title: sede.nameBranch });
      marcador.idSede = sede.idBranch;
      marcador.bindPopup(this.contenidoPopup(sede, mostrarEmpresa));
      marcador.addTo(this.capaMarcadores);
    }

    if (ajustar) {
      this.ajustarVista();
    }
  }

  private ajustarVista(): void {
    const limites = this.capaMarcadores.getBounds();
    if (this.mapa && limites.isValid()) {
      this.mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 15 });
    }
  }

  // El popup se arma con nodos del DOM (textContent) para no interpretar HTML que venga en los datos.
  private contenidoPopup(sede: Branch, mostrarEmpresa: boolean): HTMLElement {
    const contenido = document.createElement('div');
    contenido.className = 'popup-sede';

    const nombre = document.createElement('strong');
    nombre.textContent = sede.nameBranch;
    contenido.appendChild(nombre);

    const direccion = document.createElement('p');
    direccion.textContent = sede.addressBranch;
    contenido.appendChild(direccion);

    if (mostrarEmpresa) {
      const empresa = document.createElement('p');
      empresa.className = 'popup-empresa';
      empresa.textContent = this.empresas().get(sede.idCompany) ?? this.idiomaService.t('Empresa {0}', [sede.idCompany]);
      contenido.appendChild(empresa);
    }
    return contenido;
  }
}
