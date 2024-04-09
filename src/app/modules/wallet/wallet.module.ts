import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletDefaultComponent } from './wallet-default/wallet-default.component';
import { WalletRoutingModule } from './wallet-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControlWrapperComponent } from '../../components/form-control-wrapper/form-control-wrapper.component';
import { TranslateModule } from '@ngx-translate/core';
import { WalletsStoreService } from '../../services/wallets-store.service';
import { BalanceService } from '../../services/balance.service';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';
import { ApiService } from '../../services/api.service';

@NgModule({
  declarations: [WalletDefaultComponent, CreateWalletComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WalletRoutingModule,
    FormControlWrapperComponent,
    TranslateModule,
  ],
  providers: [WalletsStoreService, BalanceService, ApiService],
})
export class WalletModule {}
