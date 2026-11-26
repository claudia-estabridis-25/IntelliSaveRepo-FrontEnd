import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UsuarioService } from '../../services/usuario.service';
import { DepartmentService } from '../../services/department.service';
import { BranchService } from '../../services/branch.service';
import { CompanyService } from '../../services/company.service';
import { LoginService } from '../../services/login.service';
import { ROLES, Usuario, UsuarioInsert } from '../../models/usuario';
import { Department } from '../../models/department';
import { Branch } from '../../models/branch';
import { Company } from '../../models/company';
import { IdiomaService } from '../../services/idioma.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-usuario-registrar',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, TraducirPipe],
  templateUrl: './usuario-registrar.html',
  styleUrl: './usuario-registrar.css'
})
export class UsuarioRegistrar implements OnInit {
  form: FormGroup;
  idUsuario: number | null = null;
  areas = signal<Department[]>([]);
  sedes = signal<Branch[]>([]);
  empresas = signal<Company[]>([]);
  esAdminPlataforma = signal(false);
  rolOriginal = signal('');
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');

  opcionesRol = computed(() => {
    const opciones = [
      { valor: 'ROLE_SUPERVISOR', texto: ROLES['ROLE_SUPERVISOR'] },
      { valor: 'ROLE_EMPLOYEE', texto: ROLES['ROLE_EMPLOYEE'] }
    ];
    if (this.esAdminPlataforma() || this.rolOriginal() === 'ROLE_ADMIN') {
      opciones.unshift({ valor: 'ROLE_ADMIN', texto: 'Administrador de empresa' });
    }
    return opciones;
  });

  grupos = computed(() => {
    const variasEmpresas = this.empresas().length > 1;
    return this.sedes()
      .map(sede => {
        const empresa = this.empresas().find(e => e.idCompany === sede.idCompany)?.comercialNamecompany;
        return {
          etiqueta: variasEmpresas && empresa ? `${sede.nameBranch} · ${empresa}` : sede.nameBranch,
          areas: this.areas().filter(area => area.idBranch === sede.idBranch)
        };
      })
      .filter(grupo => grupo.areas.length > 0);
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private companyService: CompanyService,
    private loginService: LoginService,
    private idiomaService: IdiomaService
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(20)]],
      secondName: ['', Validators.maxLength(20)],
      paternalSurname: ['', [Validators.required, Validators.maxLength(25)]],
      maternalSurname: ['', [Validators.required, Validators.maxLength(25)]],
      dniUser: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      telephoneUser: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      emailUser: ['', [Validators.required, Validators.email, Validators.maxLength(60)]],
      passwordUser: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(60)]],
      positionUser: ['', [Validators.required, Validators.maxLength(25)]],
      rol: ['', Validators.required],
      idDepartment: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.departmentService.listar().subscribe({
      next: datos => this.areas.set(datos),
      error: () => this.error.set(this.idiomaService.t('No se pudo cargar la lista de áreas.'))
    });
    this.branchService.listar().subscribe({ next: datos => this.sedes.set(datos) });
    this.companyService.listar().subscribe({ next: datos => this.empresas.set(datos) });
    this.loginService.obtenerPerfil().subscribe({
      next: perfil => this.esAdminPlataforma.set(perfil.idCompany === null)
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idUsuario = Number(id);
      const clave = this.form.get('passwordUser');
      clave?.setValidators([Validators.minLength(6), Validators.maxLength(60)]);
      clave?.updateValueAndValidity();
      this.cargar(this.idUsuario);
    }
  }

  get esEdicion(): boolean {
    return this.idUsuario !== null;
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.usuarioService.listarPorId(id).subscribe({
      next: usuario => {
        const rol = this.rolPrincipal(usuario);
        this.rolOriginal.set(rol);
        this.form.patchValue({ ...usuario, rol, passwordUser: '' });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.idiomaService.t(err.status === 403 ? 'No tienes acceso a este usuario.' : 'No se encontró el usuario.'));
        this.cargando.set(false);
      }
    });
  }

  private rolPrincipal(usuario: Usuario): string {
    return ['ROLE_ADMIN', 'ROLE_SUPERVISOR', 'ROLE_EMPLOYEE'].find(rol => usuario.roles.includes(rol)) ?? '';
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

    const { rol, passwordUser, ...datos } = this.form.value;
    const usuario: UsuarioInsert = {
      ...datos,
      idUser: this.idUsuario,
      passwordUser: passwordUser ? passwordUser : null,
      roles: [rol]
    };
    const peticion = this.esEdicion
      ? this.usuarioService.modificar(usuario)
      : this.usuarioService.registrar(usuario, rol);

    peticion.subscribe({
      next: guardado => {
        const plantilla = this.esEdicion ? 'Se actualizó al usuario {0}.' : 'Se registró al usuario {0}.';
        this.router.navigate(['/usuarios'], {
          state: { mensaje: this.idiomaService.t(plantilla, [`${guardado.firstName} ${guardado.paternalSurname}`]) }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        if (err.status === 403) {
          this.error.set(this.idiomaService.t('No tienes acceso para hacer este cambio. Solo el administrador de la plataforma puede dar o quitar el rol de administrador.'));
        } else if (err.status === 400 || err.status === 404) {
          this.error.set(err.error?.message ?? this.idiomaService.t('Revisa los datos del formulario.'));
        } else {
          this.error.set(this.idiomaService.t('No se pudo guardar el usuario.'));
        }
      }
    });
  }
}
