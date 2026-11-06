import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { EquipmentService } from '../../services/equipment.service';
import { DepartmentService } from '../../services/department.service';
import { LoginService } from '../../services/login.service';
import { Equipment } from '../../models/equipment';

@Component({
  selector: 'app-equipo-listar',
  imports: [MatTableModule, MatButtonModule, RouterLink],
  templateUrl: './equipo-listar.html',
  styleUrl: './equipo-listar.css'
})
export class EquipoListar implements OnInit {
  equipos = signal<Equipment[]>([]);
  areas = signal<Map<number, string>>(new Map());
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  puedeGestionar = false;
  columnas: string[] = ['nombre', 'categoria', 'area', 'estado'];

  constructor(
    private equipmentService: EquipmentService,
    private departmentService: DepartmentService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.loginService.tieneRol('ADMIN') || this.loginService.tieneRol('SUPERVISOR');
    if (this.puedeGestionar) {
      this.columnas = [...this.columnas, 'acciones'];
    }
    this.cargar();
    this.departmentService.listar().subscribe({
      next: datos => this.areas.set(new Map(datos.map(area => [area.idDepartment, area.nameDepartment])))
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.equipmentService.listar().subscribe({
      next: datos => {
        this.equipos.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de equipos.');
        this.cargando.set(false);
      }
    });
  }

  nombreArea(idDepartment: number): string {
    return this.areas().get(idDepartment) ?? `Área ${idDepartment}`;
  }

  darDeBaja(equipo: Equipment): void {
    if (!confirm(`¿Dar de baja el equipo ${equipo.nameEquipment}? Ya no se podrá registrar consumo en él.`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.equipmentService.darDeBaja(equipo.idEquipment).subscribe({
      next: actualizado => {
        this.equipos.update(lista => lista.map(e => e.idEquipment === actualizado.idEquipment ? actualizado : e));
        this.mensaje.set(`El equipo ${equipo.nameEquipment} quedó inactivo.`);
      },
      error: (err: HttpErrorResponse) => this.error.set(this.mensajeError(err, 'No se pudo dar de baja el equipo.'))
    });
  }

  eliminar(equipo: Equipment): void {
    if (!confirm(`¿Eliminar el equipo ${equipo.nameEquipment}?`)) {
      return;
    }
    this.mensaje.set('');
    this.error.set('');
    this.equipmentService.eliminar(equipo.idEquipment).subscribe({
      next: () => {
        this.equipos.update(lista => lista.filter(e => e.idEquipment !== equipo.idEquipment));
        this.mensaje.set(`Se eliminó el equipo ${equipo.nameEquipment}.`);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(this.mensajeError(err, 'No se pudo eliminar el equipo. Revisa que no tenga consumos registrados; si los tiene, dalo de baja.'))
    });
  }

  private mensajeError(err: HttpErrorResponse, porDefecto: string): string {
    return err.status === 403 ? 'No tienes acceso a este equipo.' : porDefecto;
  }
}