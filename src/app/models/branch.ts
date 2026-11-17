export interface Branch {
  idBranch: number;
  nameBranch: string;
  addressBranch: string;
  idCompany: number;
}

export interface BranchInsert extends Branch {
  descriptionBranch: string;
  latitudeBranch: number;
  longitudeBranch: number;
}
