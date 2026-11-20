export interface ConsumptionRecord {
  idConsumptionRecord: number;
  idEquipment: number;
  idTariff: number;
  dateTimeRecord: string;
  hoursOfUse: number;
  kwhConsumption: number;
  costTotal: number;
  observationRecord: string | null;
}

export interface ConsumptionRecordInsert {
  idConsumptionRecord: number | null;
  idEquipment: number;
  idTariff: number | null;
  dateTimeRecord: string;
  hoursOfUse: number;
  observationRecord: string | null;
}
