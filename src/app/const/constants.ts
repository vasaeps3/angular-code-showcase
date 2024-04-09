import { AbstractControl } from '@angular/forms';

export const FORMAT_ETH_CURRENCY = '1.2-5';

export const EXPERT_MODE_OPTIONS = {
  gasLimit: {
    sendEth: { min: 21000, default: 25000, deltaGasPrice: 4 },
    sendToken: { min: 56000, default: 60000, deltaGasPrice: 4 },
    approveTransaction: { min: 56000, default: 60000, deltaGasPrice: 4 },
    createSW: { min: 2300000, default: 2500000, deltaGasPrice: 4 },
    joinToSW: { min: 72000, default: 75000, deltaGasPrice: 4 },
    sendEthViaSW: { min: 150000, default: 200000, deltaGasPrice: 4 },
  },
};

export const setPassFromSS = (
  address: string,
  isSaveControl: AbstractControl,
  passControl: AbstractControl
) => {
  if (!address) {
    return;
  }
  const pass = sessionStorage.getItem(address.toLowerCase()) || null;
  if (pass) {
    isSaveControl.patchValue(true);
    passControl.patchValue(pass);
    return;
  }
  isSaveControl.reset();
  passControl.reset();
};
