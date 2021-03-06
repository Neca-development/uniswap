export interface ISettings {
  privateKey: string,
  network: "mainnet" | "ropsten",
  address: string
}

export interface IAPIResponse<T> {
  data?: T;
  errorMessage?: string;
  status: any;
}
