import {
  BehaviorSubject,
  Observable,
  catchError,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Injectable } from '@angular/core';
import { IEstimationGasValue, IExRate, ISendOptions } from '../interfaces';
import { web3 } from './web3.service';
import { SHARED_WALLET, TOKEN_CONTRACT } from '../const/contract';
import { ApiService } from './api.service';

const ALT_CURRENCY_URL = 'https://ALT_CURRENCY_URL';

@Injectable()
export class BalanceService {
  public expertSendOptionsSub = new BehaviorSubject<ISendOptions | null>(null);
  public estimationGasValueSub =
    new BehaviorSubject<IEstimationGasValue | null>(null);

  public exRateSub: BehaviorSubject<IExRate> = new BehaviorSubject<IExRate>({
    title: 'USD',
    value: 0,
    isSupport: false,
  });

  get exRate(): IExRate {
    return this.exRateSub.getValue();
  }

  set exRate(exRateV: IExRate) {
    this.exRateSub.next(exRateV);
  }

  constructor(private apiService: ApiService) {}

  public getBalance(address: string): Observable<number> {
    const getBalance: Promise<bigint> = web3.eth.getBalance(address);
    return from(getBalance).pipe(
      catchError(() => of(0)),
      map((bal) => {
        return parseFloat(web3.utils.fromWei('' + bal, 'ether'));
      })
    );
  }

  public getExchangeRate(convert = 'USD') {
    convert = convert.toUpperCase();
    return this.apiService
      .getURLWithoutHeader(`${ALT_CURRENCY_URL}/listings/`)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0))),
        map(({ data = [] }: { data: { symbol: string; id: number }[] }) => {
          const e = data.find((el) => el.symbol === 'ETH') || null;
          return e ? e.id : 0;
        }),
        switchMap((id: number) => {
          return this.apiService
            .getURLWithoutHeader(`${ALT_CURRENCY_URL}/ticker/${id}/`, {
              params: { convert },
            })
            .pipe(
              catchError((error) =>
                this.apiService.handleError(error, true, of(null))
              ),
              tap((res) => {
                const data = (res && res.data) || null;
                const newCurrency =
                  (data &&
                    data.quotes[convert] &&
                    +data.quotes[convert].price) ||
                  null;
                const newExRate: IExRate = {
                  value: newCurrency ? newCurrency : 0,
                  title: convert,
                  isSupport: newCurrency ? true : false,
                };
                this.exRate = newExRate;
              })
            );
        })
      );
  }

  // ===== Get estimate gas =========
  public getEstimateGasForSendToken(data: {
    decimal: number;
    tokenAddress: string;
    amount: number;
    initiatorAddress: string;
    recipientAddress: string;
  }) {
    const tokenContract = new web3.eth.Contract(
      TOKEN_CONTRACT.abi,
      data.tokenAddress,
      { from: data.initiatorAddress }
    );
    const prepareAmount = data.amount * Math.pow(10, data.decimal);
    const transferSub = tokenContract.methods['transfer'](
      data.recipientAddress,
      prepareAmount
    ).estimateGas({ from: data.initiatorAddress });
    from(transferSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForRejectTransaction(data: {
    swalletAddress: string;
    transactionId: number;
    from: string;
  }) {
    const contract = new web3.eth.Contract(
      SHARED_WALLET.abi,
      data.swalletAddress
    );
    const confirmTransactionSub = contract.methods['rejectTransaction'](
      data.transactionId
    ).estimateGas({ from: data.from });
    from(confirmTransactionSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForConfirmTransaction(data: {
    swalletAddress: string;
    transactionId: number;
    from: string;
  }) {
    const contract = new web3.eth.Contract(
      SHARED_WALLET.abi,
      data.swalletAddress
    );
    const confirmTransactionSub = contract.methods['confirmTransaction'](
      data.transactionId
    ).estimateGas({ from: data.from });
    from(confirmTransactionSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForSendEth(transactionObject: {
    from: string;
    to: string;
    value: number;
  }) {
    const estimateGasForSendEthSub: Promise<bigint> =
      web3.eth.estimateGas(transactionObject);

    from(estimateGasForSendEthSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForSendEthToWalletFromSW(data: {
    swalletAddress: string;
    recipient: string;
    value: number;
    from: string;
  }): void {
    const contract = new web3.eth.Contract(
      SHARED_WALLET.abi,
      data.swalletAddress
    );
    const submitTransactionSub = contract.methods['submitTransaction'](
      data.recipient,
      data.value,
      '0x'
    ).estimateGas({ from: data.from });
    from(submitTransactionSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForCreateSharedWallet(data: {
    from: string;
    otherOwners: string[];
    owners: string;
    signature: string;
    changeOwners: boolean;
  }): void {
    const contract = new web3.eth.Contract(SHARED_WALLET.abi, data.from, {
      from: data.from,
    });
    const SWContract = contract.deploy({
      data: '0x' + SHARED_WALLET.byteCode,
      arguments: [
        [data.from, ...data.otherOwners],
        data.signature,
        data.owners,
        data.changeOwners,
      ],
    });
    const estimateGasPromise: Promise<bigint> = SWContract.estimateGas();
    from(estimateGasPromise)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForRemoveOwner(data: {
    from: string;
    removeOwner: string;
    swalletAddress: string;
  }) {
    const contract = new web3.eth.Contract(
      SHARED_WALLET.abi,
      data.swalletAddress
    );
    const removeOwnerSub = contract.methods['removeOwner'](
      data.removeOwner
    ).estimateGas({ from: data.from });
    from(removeOwnerSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public getEstimateGasForJoinSharedWallet(data: {
    from: string;
    newOwner: string;
    swalletAddress: string;
  }) {
    const contract = new web3.eth.Contract(
      SHARED_WALLET.abi,
      data.swalletAddress
    );
    const addOwnerSub = contract.methods['addOwner'](data.newOwner).estimateGas(
      { from: data.from }
    );
    from(addOwnerSub)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((estimateGas) => {
        this.returnGasCost(estimateGas);
      });
  }

  public returnGasCost(estimateGas: number): void {
    const getGasPrice: Promise<bigint> = web3.eth.getGasPrice();
    from(getGasPrice)
      .pipe(
        catchError((error) => this.apiService.handleError(error, true, of(0)))
      )
      .subscribe((response) => {
        const gasPrice = +response;
        if (estimateGas && gasPrice) {
          estimateGas = +estimateGas;
          this.estimationGasValueSub.next({
            estimateGas,
            gasPrice,
          });
        }
      });
  }
}
