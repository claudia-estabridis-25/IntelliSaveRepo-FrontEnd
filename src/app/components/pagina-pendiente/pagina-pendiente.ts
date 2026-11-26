import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-pagina-pendiente',
  imports: [TraducirPipe],
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