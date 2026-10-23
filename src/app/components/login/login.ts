import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { EscenaLogin } from '../escena-login/escena-login';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, EscenaLogin],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  form: FormGroup;
  cargando = signal(false);
  mensajeError = signal('');
  mensajeInfo = signal('');
  verPassword = signal(false);
  sacudir = signal(false);

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      recordar: [false]
    });
  }

  ngOnInit(): void {
    if (this.loginService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (this.route.snapshot.queryParamMap.get('expirada')) {
      this.mensajeInfo.set('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
  }

  campoInvalido(nombre: string): boolean {
    const campo = this.form.get(nombre);
    return !!campo && campo.invalid && campo.touched;
  }

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.animarError();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');
    this.mensajeInfo.set('');

    const { username, password, recordar } = this.form.value;

    this.loginService.login({ username, password }).subscribe({
      next: respuesta => {
        this.loginService.guardarSesion(respuesta, recordar);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mensajeError.set(
          error.status === 0
            ? 'No se pudo conectar con el servidor. Verifica que la API esté encendida.'
            : 'Correo o contraseña incorrectos.'
        );
        this.animarError();
      }
    });
  }

  private animarError(): void {
    this.sacudir.set(true);
    setTimeout(() => this.sacudir.set(false), 500);
  }
}