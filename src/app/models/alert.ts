export interface Alert {
  idAlert: number;
  idDepartment: number;
  nameDepartment: string;
  idEquipment: number;
  nameEquipment: string;
  dateTimeAlert: string;
  typeAlert: string;
  descriptionAlert: string;
  priorityLevelAlert: string;
  kwhDetected: number;
  statusAlert: string;
  dateTimeResolution: string | null;
}

export interface AlertInsert {
  idAlert: number | null;
  idEquipment: number;
  dateTimeAlert: string | null;
  typeAlert: string;
  descriptionAlert: string;
  priorityLevelAlert: string;
  kwhDetected: number;
  statusAlert: string | null;
}

export const ESTADOS_ALERTA = ['Pendiente', 'En revisión', 'Atendida', 'Descartada'];
export const PRIORIDADES_ALERTA = ['Alta', 'Media', 'Baja'];
