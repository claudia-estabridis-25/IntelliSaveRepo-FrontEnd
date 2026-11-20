export interface Equipment {
  idEquipment: number;
  idDepartment: number;
  nameEquipment: string;
  categoryEquipment: string;
  statusEquipment: string;
}

export interface EquipmentInsert extends Equipment {
  brandEquipment: string;
  modelEquipment: string;
  wattPowerEquipment: number;
  acquisitionDateEquipment: string;
}
