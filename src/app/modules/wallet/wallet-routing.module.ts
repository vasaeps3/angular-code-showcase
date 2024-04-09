import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WalletDefaultComponent } from './wallet-default/wallet-default.component';
import { CreateWalletComponent } from './create-wallet/create-wallet.component';

const routes: Routes = [
  {
    path: '',
    component: WalletDefaultComponent,
    children: [
      {
        path: 'create',
        component: CreateWalletComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WalletRoutingModule {}
