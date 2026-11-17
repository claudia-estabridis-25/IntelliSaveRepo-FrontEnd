export interface Usuario {
  idUser: number;
  emailUser: string;
  positionUser: string;
  dniUser: string;
  firstName: string;
  secondName: string;
  paternalSurname: string;
  maternalSurname: string;
  telephoneUser: string;
  statusUser: boolean;
  idDepartment: number;
  nameDepartment: string;
  idBranch: number | null;
  nameBranch: string | null;
  idCompany: number | null;
  nameCompany: string | null;
  roles: string[];
}

export interface UsuarioInsert {
  idUser: number | null;
  emailUser: string;
  passwordUser: string | null;
  dniUser: string;
  firstName: string;
  secondName: string;
  paternalSurname: string;
  maternalSurname: string;
  positionUser: string;
  telephoneUser: string;
  idDepartment: number;
  roles: string[];
}

export const ROLES: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_SUPERVISOR: 'Supervisor energético',
  ROLE_EMPLOYEE: 'Empleado'
};
