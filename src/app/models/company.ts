export interface Company {
  idCompany: number;
  rucCompany: string;
  comercialNamecompany: string;
  addressCompany: string;
  emailCompany: string;
}

export interface CompanyInsert extends Company {
  formalNameCompany: string;
  phoneNumberCompany: string;
  sectorCompany: string;
  nameOwnerCompany: string;
  surnameOwnerCompany: string;
  descriptionCompany: string;
}
