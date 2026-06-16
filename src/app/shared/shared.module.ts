import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AdminPaginationComponent } from './components/admin-pagination/admin-pagination.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { GlobalLoadingComponent } from './components/global-loading/global-loading.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { MapPickerComponent } from '../features/client/components/map-picker/map-picker.component';

@NgModule({
  declarations: [
    GlobalLoadingComponent,
    ToastContainerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    AdminPaginationComponent,
    MapPickerComponent
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, TranslateModule],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    GlobalLoadingComponent,
    ToastContainerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PaginationComponent,
    AdminPaginationComponent,
    MapPickerComponent
  ]
})
export class SharedModule {}
