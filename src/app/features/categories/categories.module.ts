import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';

@NgModule({
  declarations: [CategoriesPageComponent],
  imports: [SharedModule, CategoriesRoutingModule]
})
export class CategoriesModule {}
