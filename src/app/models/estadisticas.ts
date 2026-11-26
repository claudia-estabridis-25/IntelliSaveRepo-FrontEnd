// Respuestas de los endpoints de conteos y comparaciones (dashboard por rol y comparar sedes).

export interface ConteoAlertas {
  category: string;
  totalAlerts: number;
}

export interface ConteoSector {
  sectorCompany: string;
  totalCompanies: number;
}

export interface ConsumoElevado {
  idEquipment: number;
  nameEquipment: string;
  totalKwhConsumption: number;
  departmentAverageKwh: number;
  elevatedConsumption: boolean;
}

export interface ConsumoSede {
  idBranch: number;
  nameBranch: string;
  totalRecords: number;
  totalKwh: number;
  totalCost: number;
}

export interface EmisionSede {
  idBranch: number;
  nameBranch: string;
  totalCalculations: number;
  totalKwh: number;
  totalCo2Emissions: number;
}

// Alertas por área, tipo y estado (consulta nativa con JOIN: GET /api/alerts/count-by-department).
export interface ConteoAlertasArea {
  idDepartment: number;
  nameDepartment: string;
  typeAlert: string;
  statusAlert: string;
  totalAlerts: number;
}

// Emisiones de CO2 por área (GET /api/carbon-footprints/by-department).
export interface EmisionArea {
  idDepartment: number;
  nameDepartment: string;
  totalCalculations: number;
  totalKwh: number;
  totalCo2Emissions: number;
}

// Comparación de la huella entre dos fechas de cálculo (GET /api/carbon-footprints/compare).
export interface ComparacionHuella {
  scope: string;
  timePeriod: string;
  dateA: string;
  kwhA: number;
  co2A: number;
  dateB: string;
  kwhB: number;
  co2B: number;
  variationCo2: number;
  variationPercent: number | null;
  trend: string;
}
