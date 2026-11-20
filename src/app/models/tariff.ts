export interface Tariff {
  idTariff: number;
  idBranch: number;
  nameBranch: string;
  initialEffectiveDate: string;
  endEffectiveDate: string;
  costPerKwh: number;
  supplier: string | null;
}

export interface TariffInsert {
  idTariff: number | null;
  idBranch: number;
  initialEffectiveDate: string;
  endEffectiveDate: string;
  costPerKwh: number;
  supplier: string | null;
}
