import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() title = 'Khong co du lieu';
  @Input() description = 'Hay dieu chinh bo loc hoac tao moi du lieu.';
}
