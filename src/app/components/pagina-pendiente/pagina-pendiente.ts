import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pagina-pendiente',
  templateUrl: './pagina-pendiente.html',
  styleUrl: './pagina-pendiente.css'
})
export class PaginaPendiente {
  titulo: string;
  historia: string;

  constructor(private route: ActivatedRoute) {
    this.titulo = this.route.snapshot.data['titulo'];
    this.historia = this.route.snapshot.data['historia'];
  }
}