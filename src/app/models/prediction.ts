export interface Prediction {
  idPrediction: number;
  idDepartment: number;
  nameDepartment: string;
  idEquipment: number | null;
  nameEquipment: string | null;
  generationDatePrediction: string;
  initialDatePrediction: string;
  endDatePrediction: string;
  kwhPrediction: number;
  costPrediction: number;
  modelAI: string;
  confidenceLevelAI: number;
  descriptionPrediction: string;
  statusPrediction: string;
  realKwh: number | null;
  deviationPercent: number | null;
}

export interface PredictionRequest {
  idDepartment: number | null;
  idEquipment: number | null;
  initialDatePrediction: string;
  endDatePrediction: string;
}

export interface PredictionResult {
  prediction: Prediction;
  historicalDaysWithData: number;
}
