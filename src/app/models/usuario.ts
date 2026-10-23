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
  roles: string[];
}