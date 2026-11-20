export interface CarbonFootprint {
  idFootprint: number;
  idDepartment: number;
  nameDepartment: string;
  idBranch: number;
  nameBranch: string;
  timePeriod: string;
  periodStartDate: string;
  calculationDate: string;
  emissionFactor: number;
  kwhTotalConsumption: number;
  co2Emissions: number;
}

export interface CarbonFootprintInsert {
  idFootprint: number | null;
  idDepartment: number;
  timePeriod: string;
  calculationDate: string | null;
  emissionFactor: number;
}

export const PERIODOS_HUELLA = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
