import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { StoreLocatorComponent } from './pages/store-locator/store-locator.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { PromotionsComponent } from './pages/promotions/promotions.component';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking.component';
import { CartComponent } from './components/cart/cart.component';
import { AddressListComponent } from './pages/address-list/address-list.component';
import { AddressFormComponent } from './pages/address-form/address-form.component';
import { PaymentResultComponent } from './pages/payment-result/payment-result.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'menu',
    component: MenuComponent
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent
  },
  {
    path: 'promotions',
    component: PromotionsComponent
  },
  {
    path: 'track-order',
    component: OrderTrackingComponent
  },
  {
    path: 'track-order/:orderId',
    component: OrderTrackingComponent
  },
  {
    path: 'stores',
    component: StoreLocatorComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'payment/momo-return',
    component: PaymentResultComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'addresses/new',
    component: AddressFormComponent
  },
  {
    path: 'addresses/edit/:id',
    component: AddressFormComponent
  },
  {
    path: 'addresses',
    component: AddressListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule {}

