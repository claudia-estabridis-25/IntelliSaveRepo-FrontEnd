export interface Branch {
  idBranch: number;
  nameBranch: string;
  addressBranch: string;
  descriptionBranch: string;
  latitudeBranch: number | null;
  longitudeBranch: number | null;
  idCompany: number;
}

export interface BranchInsert extends Branch {
  latitudeBranch: number;
  longitudeBranch: number;
}
