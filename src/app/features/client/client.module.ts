import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { StoreLocatorComponent } from './pages/store-locator/store-locator.component';
import { ProfileComponent } from './pages/profile/profile.component';

// Components
import { CartComponent } from './components/cart/cart.component';

@NgModule({
  declarations: [
    HomeComponent,
    MenuComponent,
    StoreLocatorComponent,
    ProfileComponent,
    CartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ClientRoutingModule
  ]
})
export class ClientModule {}
