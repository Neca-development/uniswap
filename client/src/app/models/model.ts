export interface ISettings {
  privateKey: string,
  network: {
    chainId: number,
    nodeAddress: string,
    name: string
  },
  address: string
}
