export interface ReportItem {
  id: number;
  name: string;
  detail: string;
  recordCount: number;
  totalKwh: number;
  totalCost: number;
}

export interface ConsumptionReport {
  desde: string;
  hasta: string;
  idBranch: number | null;
  totalRecords: number;
  totalKwh: number;
  totalCost: number;
  byBranch: ReportItem[];
  byDepartment: ReportItem[];
  topEquipments: ReportItem[];
}
