import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { CategoryService } from './services/category.service';

@NgModule({
  declarations: [CategoriesPageComponent],
  imports: [SharedModule, CategoriesRoutingModule],
  providers: [CategoryService]
})
export class CategoriesModule {}
