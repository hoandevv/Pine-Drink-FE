import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductTableComponent } from './components/product-table/product-table.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductToppingsPageComponent } from './pages/product-toppings-page/product-toppings-page.component';
import { ProductVariantsPageComponent } from './pages/product-variants-page/product-variants-page.component';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductService } from './services/product.service';

@NgModule({
  declarations: [
    ProductFormComponent,
    ProductTableComponent,
    ProductListComponent,
    ProductDetailComponent,
    ProductVariantsPageComponent,
    ProductToppingsPageComponent
  ],
  imports: [SharedModule, ProductsRoutingModule],
  providers: [ProductService]
})
export class ProductsModule {}
