export interface ClimateRecord {
  idClimate: number;
  climateDateTime: string;
  temperature: number;
  humidity: number;
  climateCondition: string;
  windSpeed: number;
  thermalSensation: number;
  idBranch: number;
  nameBranch: string;
  idCompany: number;
  nameCompany: string;
}

export interface ClimateRefreshResult {
  totalBranches: number;
  savedRecords: number;
  errors: string[];
}
