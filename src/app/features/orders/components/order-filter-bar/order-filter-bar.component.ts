import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-order-filter-bar',
  templateUrl: './order-filter-bar.component.html',
  styleUrls: ['./order-filter-bar.component.scss']
})
export class OrderFilterBarComponent {
  filterForm: FormGroup;
  @Output() filterChange = new EventEmitter<any>();

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      payment: [''],
      type: [''],
      dateRange: ['today']
    });

    this.filterForm.valueChanges.subscribe((val: any) => this.filterChange.emit(val));
  }

  reset() {
    this.filterForm.reset({ dateRange: 'today', search: '', status: '', payment: '', type: '' });
  }
}

