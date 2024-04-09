import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IWalletListElement, WALLETS_TYPE } from '../interfaces';

const MOCKDATA: IWalletListElement[] = [
  {
    address: 'address-SHARED',
    eth: 12,
    id: 'id-SHARED',
    isBalanceHidden: true,
    isFavorite: false,
    name: 'name11',
    type: WALLETS_TYPE.SHARED,
    ye: 11,
  },
  {
    address: 'address-PERSONAL',
    eth: 12,
    id: 'id-PERSONAL',
    isBalanceHidden: true,
    isFavorite: false,
    name: 'name11',
    type: WALLETS_TYPE.PERSONAL,
    ye: 11,
  },
];
@Injectable()
export class WalletsStoreService {
  public walletsListSub: BehaviorSubject<IWalletListElement[]> =
    new BehaviorSubject<IWalletListElement[]>(MOCKDATA);

  get walletsList(): IWalletListElement[] {
    return this.walletsListSub.getValue();
  }

  set walletsList(walletsList: IWalletListElement[]) {
    this.walletsListSub.next(walletsList);
  }

  get walletsListWithoutSW(): IWalletListElement[] {
    return this.walletsList.filter((el) => el.type !== WALLETS_TYPE.SHARED);
  }

  get walletsListSW(): IWalletListElement[] {
    return this.walletsList.filter((el) => el.type === WALLETS_TYPE.SHARED);
  }
}
