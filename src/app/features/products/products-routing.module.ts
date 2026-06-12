import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductToppingsPageComponent } from './pages/product-toppings-page/product-toppings-page.component';
import { ProductVariantsPageComponent } from './pages/product-variants-page/product-variants-page.component';
import { DailyStocksPageComponent } from './pages/daily-stocks-page/daily-stocks-page.component';

const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'variants', component: ProductVariantsPageComponent },
  { path: 'daily-stocks', component: DailyStocksPageComponent },
  { path: 'toppings', component: ProductToppingsPageComponent },
  { path: 'create', component: ProductDetailComponent },
  { path: ':id', component: ProductDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule {}
