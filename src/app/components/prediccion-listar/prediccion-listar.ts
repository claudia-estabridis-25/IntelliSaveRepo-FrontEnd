import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PredictionService } from '../../services/prediction.service';
import { LoginService } from '../../services/login.service';
import { Prediction } from '../../models/prediction';

@Component({
  selector: 'app-prediccion-listar',
  imports: [MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './prediccion-listar.html',
  styleUrl: './prediccion-listar.css'
})
export class PrediccionListar implements OnInit {
  predicciones = signal<Prediction[]>([]);
  estado = signal('');
  cargando = signal(true);
  evaluando = signal(false);
  mensaje = signal('');
  error = signal('');
  esAdmin = false;
  abierta = signal<number | null>(null);
  analizando = signal(false);
  errorAnalisis = signal('');
  estados = ['En curso', 'Cumplida', 'Errada'];
  columnas = ['objetivo', 'periodo', 'prediccion', 'confianza', 'real', 'estado', 'acciones'];

  filtradas = computed(() =>
    this.predicciones()
      .filter(prediccion => !this.estado() || prediccion.statusPrediction === this.estado())
      .sort((a, b) => b.idPrediction - a.idPrediction)
  );

  seleccionada = computed(() =>
    this.predicciones().find(prediccion => prediccion.idPrediction === this.abierta()) ?? null
  );

  constructor(private predictionService: PredictionService, private loginService: LoginService) {}

  ngOnInit(): void {
    this.mensaje.set(history.state?.mensaje ?? '');
    this.abierta.set(history.state?.abrir ?? null);
    this.esAdmin = this.loginService.tieneRol('ADMIN');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.predictionService.listar().subscribe({
      next: datos => {
        this.predicciones.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de predicciones.');
        this.cargando.set(false);
      }
    });
  }

  colorEstado(estado: string): string {
    return estado === 'Cumplida' ? 'verde' : estado === 'Errada' ? 'rojo' : 'ambar';
  }

  evaluar(): void {
    this.evaluando.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.predictionService.evaluar().subscribe({
      next: evaluadas => {
        this.evaluando.set(false);
        this.mensaje.set(evaluadas.length === 0
          ? 'No hay predicciones con el periodo terminado por evaluar.'
          : `Se evaluaron ${evaluadas.length} predicciones con el consumo real.`);
        this.cargar();
      },
      error: () => {
        this.evaluando.set(false);
        this.error.set('No se pudieron evaluar las predicciones.');
      }
    });
  }

  verAnalisis(prediccion: Prediction): void {
    this.errorAnalisis.set('');
    this.abierta.set(this.abierta() === prediccion.idPrediction ? null : prediccion.idPrediction);
  }

  cerrarAnalisis(): void {
    this.abierta.set(null);
    this.errorAnalisis.set('');
  }

  generarAnalisis(prediccion: Prediction): void {
    this.analizando.set(true);
    this.errorAnalisis.set('');
    this.predictionService.analizar(prediccion.idPrediction).subscribe({
      next: actualizada => {
        this.predicciones.update(lista => lista.map(p => p.idPrediction === actualizada.idPrediction ? actualizada : p));
        this.analizando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.analizando.set(false);
        this.errorAnalisis.set(err.status === 400
          ? (err.error?.message ?? 'No se pudo generar el análisis con IA.')
          : 'No se pudo generar el análisis con IA. Intenta de nuevo en unos minutos.');
      }
    });
  }

  eliminar(prediccion: Prediction): void {
    if (!confirm(`¿Eliminar la predicción de ${prediccion.nameEquipment ?? prediccion.nameDepartment}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.predictionService.eliminar(prediccion.idPrediction).subscribe({
      next: () => {
        this.predicciones.update(lista => lista.filter(p => p.idPrediction !== prediccion.idPrediction));
        if (this.abierta() === prediccion.idPrediction) {
          this.cerrarAnalisis();
        }
        this.mensaje.set('Se eliminó la predicción.');
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 403 ? 'No tienes acceso para eliminar esta predicción.' : 'No se pudo eliminar la predicción.');
      }
    });
  }
}
