export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export type ApiMutationResponse = {
  message?: string;
  changedKeys?: string[];
  [key: string]: unknown;
};

export type BankAccountDetails = {
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  bank_name?: string;
};
