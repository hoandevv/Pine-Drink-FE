import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ClientRoutingModule } from './client-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { StoreLocatorComponent } from './pages/store-locator/store-locator.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { PromotionsComponent } from './pages/promotions/promotions.component';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking.component';
import { AddressListComponent } from './pages/address-list/address-list.component';
import { AddressFormComponent } from './pages/address-form/address-form.component';
import { PaymentResultComponent } from './pages/payment-result/payment-result.component';

// Components
import { CartComponent } from './components/cart/cart.component';
import { BranchService } from '../branches/services/branch.service';

@NgModule({
  declarations: [
    HomeComponent,
    MenuComponent,
    StoreLocatorComponent,
    ProfileComponent,
    CartComponent,
    ProductDetailComponent,
    PromotionsComponent,
    OrderTrackingComponent,
    AddressListComponent,
    AddressFormComponent,
    PaymentResultComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ClientRoutingModule,
    SharedModule
  ],
  providers: [
    BranchService
  ]
})
export class ClientModule {}

