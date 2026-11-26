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
