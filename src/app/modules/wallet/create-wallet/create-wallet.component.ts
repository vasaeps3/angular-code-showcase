import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  NoWhitespaceValidator,
  addressValidator,
  importedValidator,
} from '../../../const/validation';
import {
  IEstimationGasValue,
  IExRate,
  ISendOptions,
  IWalletListElement,
} from '../../../interfaces';
import { Subscription } from 'rxjs';
import { WalletsStoreService } from '../../../services/wallets-store.service';
import {
  EXPERT_MODE_OPTIONS,
  FORMAT_ETH_CURRENCY,
  setPassFromSS,
} from '../../../const/constants';
import { BalanceService } from '../../../services/balance.service';

interface Select {
  title: string;
  value: string | number;
  disabled?: boolean;
}

interface WalletForm {
  name: FormControl<string | null>;
  maxOwners: FormControl<string>;
  signature: FormControl<string>;
  initiatorAddress: FormControl<string | null>;
  isSavePasswordSw: FormControl<boolean>;
  otherOwners: FormArray<FormControl<string>>;
  isOwnersChanges: FormControl<boolean>;
  jsonPasswordSw: FormControl<string | null>;
  costTransactionEth: FormControl<number>;
  isExpertModeSw: FormControl<boolean>;
}

const createSimpleNumberedSelectList = (
  start: number,
  max: number
): Select[] => {
  const result: Select[] = [];
  for (let i = 0; i <= max - start; i++) {
    result[i] = {
      title: (start + i).toString(),
      value: (start + i).toString(),
    };
  }
  return result;
};

@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styleUrl: './create-wallet.component.scss',
})
export class CreateWalletComponent implements OnInit, OnDestroy {
  public isExpertModeSw = false;
  public FORMAT_ETH_CURRENCY = FORMAT_ETH_CURRENCY;
  public exRate: IExRate = this.balanceService.exRate;
  public isDisabledForm = false;
  public errorOtherOwners: string | null = null;
  public sendExpertModeData = { gasPrice: 0, gasLimit: 0 };
  public costTransaction = {
    eth: 0,
    ye: 0,
  };

  public expertSendOptions: ISendOptions = {
    slider: { min: 1, max: 50, value: 7 },
    data: '',
    gasLimit: EXPERT_MODE_OPTIONS.gasLimit['sendEth'].default,
    minGasLimit: EXPERT_MODE_OPTIONS.gasLimit['sendEth'].min,
  };

  public formGroup!: FormGroup<WalletForm>;
  public errors!: { [name: string]: { [key: string]: string } };

  public ownersCountList: Select[] = createSimpleNumberedSelectList(2, 6);
  public walletsSelectList: Select[] = [];
  public signatureCountList: Select[] = createSimpleNumberedSelectList(1, 2);

  public initiatorWallet: IWalletListElement | undefined;
  public walletsListWithoutSW!: IWalletListElement[];

  private subscriptions: Subscription[] = [];

  get otherOwners() {
    return this.formGroup.get('otherOwners') as FormArray;
  }

  constructor(
    private formBuilder: FormBuilder,
    private wsService: WalletsStoreService,
    private balanceService: BalanceService
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  ngOnInit() {
    this.errors = this.createErrors();
    this.formGroup = this.formBuilder.group<WalletForm>(
      this.createFormControls()
    );

    this.subscriptions.push(
      this.wsService.walletsListSub.subscribe(() => {
        this.walletsListWithoutSW = this.wsService.walletsListWithoutSW;
        this.walletsSelectList = this.wsService.walletsListWithoutSW.map(
          (el) => ({ title: el.name, value: el.address })
        );
        this.initiatorWallet = this.findStartInitiatorWallet();
        if (this.initiatorWallet) {
          this.formGroup
            .get('initiatorAddress')
            ?.setValue(
              this.initiatorWallet ? this.initiatorWallet.address : null
            );
        }
      }),

      this.formGroup.valueChanges.subscribe(() => {
        this.isDisabledForm =
          this.formGroup.valid &&
          this.checkExpertSendOptions() &&
          !this.errorOtherOwners;
      }),

      (
        this.formGroup.get('initiatorAddress') as FormControl
      ).valueChanges.subscribe((address: string) => {
        this.initiatorWallet = this.walletsListWithoutSW.find(
          (e) => e.address === address
        );
        this.getEstimateGasForCreateSharedWallet();
        (this.formGroup.get('initiatorAddress') as FormControl).markAsTouched();
        setPassFromSS(
          address,
          this.formGroup.get('isSavePasswordSw') as FormControl,
          this.formGroup.get('jsonPasswordSw') as FormControl
        );
      }),

      this.balanceService.estimationGasValueSub.subscribe((estimationGas) => {
        if (!estimationGas) {
          return;
        }
        this.updateGasValue(estimationGas);
      }),

      (
        this.formGroup.get('isExpertModeSw') as FormControl
      ).valueChanges.subscribe((value: boolean) => {
        this.isExpertModeSw = value;
      }),

      (
        this.formGroup.get('costTransactionEth') as FormControl
      ).valueChanges.subscribe((costTransactionEth) => {
        this.costTransaction.eth = costTransactionEth;
        this.costTransaction.ye =
          this.costTransaction.eth * this.balanceService.exRate.value;
      }),

      (this.formGroup.get('maxOwners') as FormControl).valueChanges.subscribe(
        (value: number) => {
          this.signatureCountList = createSimpleNumberedSelectList(1, value);
          this.formGroup.patchValue({ signature: '1' });
          this.getEstimateGasForCreateSharedWallet();
          this.checkCountOwners();
        }
      ),
      (this.formGroup.get('signature') as FormControl).valueChanges.subscribe(
        () => {
          this.getEstimateGasForCreateSharedWallet();
        }
      ),
      (
        this.formGroup.get('isOwnersChanges') as FormControl
      ).valueChanges.subscribe(() => {
        this.getEstimateGasForCreateSharedWallet();
        this.checkCountOwners();
      }),
      (this.formGroup.get('otherOwners') as FormControl).valueChanges.subscribe(
        () => {
          this.getEstimateGasForCreateSharedWallet();
          this.checkCountOwners();
        }
      )
    );

    this.initialStateForm();
  }

  public removeOwner(index: number): void {
    (<FormArray>this.formGroup.get('otherOwners')).removeAt(index);
  }

  public addOwner(): void {
    (<FormArray>this.formGroup.get('otherOwners')).push(
      new FormControl('', [
        Validators.required,
        Validators.minLength(42),
        addressValidator,
      ])
    );
  }

  private initialStateForm() {
    this.initiatorWallet = this.findStartInitiatorWallet();
    this.formGroup.patchValue({
      maxOwners: '2',
      signature: '1',
      initiatorAddress: this.initiatorWallet
        ? this.initiatorWallet.address
        : null,
      isExpertModeSw: false,
      isOwnersChanges: false,
    });
  }

  private createFormControls(): WalletForm {
    return {
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
        NoWhitespaceValidator,
      ]),
      maxOwners: new FormControl(),
      signature: new FormControl(),
      initiatorAddress: new FormControl(null, [
        Validators.required,
        importedValidator,
      ]),
      jsonPasswordSw: new FormControl('', [
        Validators.required,
        // Validators.pattern(PASSWORD_REGEX),
        Validators.minLength(8),
      ]),
      isSavePasswordSw: new FormControl(),
      isExpertModeSw: new FormControl(),
      costTransactionEth: new FormControl(0, { nonNullable: true }),
      otherOwners: new FormArray<FormControl<string>>([]),
      isOwnersChanges: new FormControl(false, { nonNullable: true }),
    };
  }

  private createErrors(): {
    [name in keyof WalletForm]: { [key: string]: string };
  } {
    return {
      name: {
        required: 'form_error_field_required',
        minlength: 'form_error_length.min_4',
        whitespace: 'not_whitespace',
      },
      maxOwners: {},
      signature: {},
      initiatorAddress: {
        required: 'form_error_field_required',
        isNotImported: 'error_wallet_not_imported',
      },
      jsonPasswordSw: {
        required: 'form_error_field_required',
        minlength: 'form_error_length.min_8',
        pattern: '',
      },
      otherOwners: {
        required: 'form_error_field_required',
        minlength: 'form_error_length.min_42',
        invalidAddress: 'error_address_not_match_regex',
      },
      isOwnersChanges: {},
      isSavePasswordSw: {},
      costTransactionEth: {},
      isExpertModeSw: {},
    };
  }

  private findStartInitiatorWallet(): IWalletListElement | undefined {
    const favorite = this.walletsListWithoutSW.find(
      (el) =>
        el.isFavorite &&
        localStorage.getItem(el.address.toLocaleLowerCase()) &&
        el.eth > 0
    );
    if (favorite) {
      return favorite;
    }
    const imported = this.walletsListWithoutSW.find(
      (el) => localStorage.getItem(el.address.toLocaleLowerCase()) && el.eth > 0
    );

    if (imported) {
      return imported;
    }

    return this.walletsListWithoutSW[0];
  }

  private checkExpertSendOptions(): boolean {
    return this.expertSendOptions.gasLimit > 0;
  }

  private getEstimateGasForCreateSharedWallet(): void {
    if (!this.initiatorWallet) {
      return;
    }

    // we cant use this method without real address
    // address-SHARED = for mock data
    // this.balanceService.getEstimateGasForCreateSharedWallet({
    //   from: this.initiatorWallet.address,
    //   otherOwners: (this.formGroup.get('otherOwners') as FormArray).value,
    //   owners: (this.formGroup.get('maxOwners') as FormControl).value,
    //   signature: (this.formGroup.get('signature') as FormControl).value,
    //   changeOwners: (this.formGroup.get('isOwnersChanges') as FormControl)
    //     .value,
    // });
  }

  private updateGasValue(estimationGas: IEstimationGasValue) {
    if (!estimationGas) {
      estimationGas = {
        estimateGas: 0,
        gasPrice: 0,
      };
    }
    const ceilGasPrice = Math.ceil(estimationGas.gasPrice / 1e9);
    this.expertSendOptions.slider.value = ceilGasPrice;
    this.expertSendOptions.slider['warning'] = {
      min:
        ceilGasPrice - EXPERT_MODE_OPTIONS.gasLimit['createSW'].deltaGasPrice,
    };
    this.expertSendOptions.gasLimit =
      estimationGas.estimateGas >
      EXPERT_MODE_OPTIONS.gasLimit['createSW'].default
        ? estimationGas.estimateGas
        : EXPERT_MODE_OPTIONS.gasLimit['createSW'].default;
    this.expertSendOptions.minGasLimit =
      EXPERT_MODE_OPTIONS.gasLimit['createSW'].min;
    this.balanceService.expertSendOptionsSub.next(this.expertSendOptions);
    this.onChangeExpertMode(this.expertSendOptions);
  }

  private onChangeExpertMode(newApproveExpertOptions: ISendOptions): void {
    this.expertSendOptions = newApproveExpertOptions;
    const costTransactionEth =
      (newApproveExpertOptions.gasLimit *
        newApproveExpertOptions.slider.value) /
      1e9;
    this.sendExpertModeData.gasPrice =
      newApproveExpertOptions.slider.value * 1e9;
    this.sendExpertModeData.gasLimit = newApproveExpertOptions.gasLimit;
    this.formGroup.patchValue({ costTransactionEth });
  }

  private checkCountOwners() {
    const numberOfOwners = (this.formGroup.get('maxOwners') as FormControl)
      .value;
    const formGroupArray = <FormArray>this.formGroup.get('otherOwners');
    if (
      formGroupArray.controls &&
      formGroupArray.controls.length > +numberOfOwners - 1
    ) {
      this.errorOtherOwners = 'other_owner_max_error';
      this.formGroup.setErrors({ errOther: true });
    } else {
      this.errorOtherOwners = null;
    }
  }
}
