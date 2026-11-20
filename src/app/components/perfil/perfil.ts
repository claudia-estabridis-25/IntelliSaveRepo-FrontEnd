import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UsuarioService } from '../../services/usuario.service';
import { PerfilUpdate, Usuario } from '../../models/usuario';

function clavesValidas(grupo: AbstractControl): ValidationErrors | null {
  const actual = grupo.get('currentPassword')?.value;
  const nueva = grupo.get('newPassword')?.value;
  const repetida = grupo.get('repeatPassword')?.value;
  if (!nueva && !repetida && !actual) {
    return null;
  }
  const errores: ValidationErrors = {};
  if (nueva !== repetida) {
    errores['noCoinciden'] = true;
  }
  if (nueva && !actual) {
    errores['faltaActual'] = true;
  }
  if (!nueva && actual) {
    errores['faltaNueva'] = true;
  }
  return Object.keys(errores).length > 0 ? errores : null;
}

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  form: FormGroup;
  perfil = signal<Usuario | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');

  nombreCompleto = computed(() => {
    const datos = this.perfil();
    return datos
      ? [datos.firstName, datos.secondName, datos.paternalSurname, datos.maternalSurname].filter(parte => !!parte).join(' ')
      : '';
  });

  rol = computed(() => {
    const roles = this.perfil()?.roles ?? [];
    if (roles.includes('ROLE_ADMIN')) {
      return this.perfil()?.idCompany === null ? 'Administrador de la plataforma' : 'Administrador de empresa';
    }
    return roles.includes('ROLE_SUPERVISOR') ? 'Supervisor energético' : 'Empleado de área';
  });

  ubicacion = computed(() => {
    const datos = this.perfil();
    return datos ? [datos.nameDepartment, datos.nameBranch, datos.nameCompany].filter(parte => !!parte).join(' · ') : '';
  });

  constructor(private fb: FormBuilder, private usuarioService: UsuarioService) {
    this.form = this.fb.group({
      secondName: ['', Validators.maxLength(20)],
      telephoneUser: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6), Validators.maxLength(60)]],
      repeatPassword: ['']
    }, { validators: clavesValidas });
  }

  ngOnInit(): void {
    this.usuarioService.miPerfil().subscribe({
      next: datos => {
        this.mostrar(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu perfil.');
        this.cargando.set(false);
      }
    });
  }

  private mostrar(datos: Usuario): void {
    this.perfil.set(datos);
    this.form.reset({
      secondName: datos.secondName ?? '',
      telephoneUser: datos.telephoneUser ?? '',
      currentPassword: '',
      newPassword: '',
      repeatPassword: ''
    });
  }

  faltanDigitos(): number {
    return 9 - (this.form.get('telephoneUser')?.value?.length ?? 0);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.mensaje.set('');
    this.error.set('');

    const valores = this.form.value;
    const cambiaClave = !!valores.newPassword;
    const datos: PerfilUpdate = {
      secondName: valores.secondName.trim(),
      telephoneUser: valores.telephoneUser,
      newPassword: cambiaClave ? valores.newPassword : null,
      currentPassword: cambiaClave ? valores.currentPassword : null
    };

    this.usuarioService.editarMiPerfil(datos).subscribe({
      next: actualizado => {
        this.guardando.set(false);
        this.mostrar(actualizado);
        this.mensaje.set(cambiaClave ? 'Se guardaron tus datos y tu nueva contraseña.' : 'Se guardaron tus datos.');
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message ?? 'No se pudieron guardar los cambios.');
      }
    });
  }
}
