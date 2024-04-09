export interface IExRate {
  title: string;
  value: number;
  isSupport?: boolean;
}

export enum WALLETS_TYPE {
  PERSONAL = 'personal',
  BRAIN = 'brain',
  SHARED = 'shared',
}

export interface ISendOptions {
  slider: {
    min: number;
    max: number;
    value: number;
    warning?: { min: number };
    step?: number;
  };
  data: string;
  gasLimit: number;
  minGasLimit?: number;
  warning?: { min: number };
}

export interface IEstimationGasValue {
  estimateGas: number;
  gasPrice: number;
}

export interface IWalletListElement {
  id: string;
  type: WALLETS_TYPE;
  address: string;
  isBalanceHidden: boolean;
  eth: number;
  ye: number;
  name: string;
  isFavorite: boolean;
  // ...
}
