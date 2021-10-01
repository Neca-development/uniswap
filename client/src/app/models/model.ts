export interface ISettings {
  privateKey: string,
  network: {
    chainId: number,
    nodeAddress: string,
    name: string
  },
  address: string
}

export interface IResponse {
  messaga: string,
  status: string,
  result: any
}

export interface IGasPriceResponse extends IResponse{
  result: {
    FastGasPrice: string,
    SaveGasPrice: string,
    ProposeGasPrice: string,
    LastBlock: string
  }
}
