import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ClientRoutingModule } from './client-routing.module';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { StoreLocatorComponent } from './pages/store-locator/store-locator.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Components
import { CartComponent } from './components/cart/cart.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { PromotionsComponent } from './pages/promotions/promotions.component';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking.component';

@NgModule({
  declarations: [
    HomeComponent,
    MenuComponent,
    StoreLocatorComponent,
    ProfileComponent,
    CartComponent,
    ProductDetailComponent,
    PromotionsComponent,
    OrderTrackingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ClientRoutingModule
  ]
})
export class ClientModule {}
