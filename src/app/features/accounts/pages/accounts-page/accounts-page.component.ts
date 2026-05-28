import { Component } from '@angular/core';

@Component({ selector: 'app-accounts-page', templateUrl: './accounts-page.component.html', styleUrls: ['./accounts-page.component.scss'] })
export class AccountsPageComponent {
  readonly accounts = [
    { name: 'Hoan Admin', role: 'SUPER_ADMIN', email: 'hoan@pinedrink.vn', status: 'Online' },
    { name: 'Mai Store', role: 'MANAGER', email: 'mai.manager@pinedrink.vn', status: 'Active' },
    { name: 'Khoa Staff', role: 'STAFF', email: 'khoa.staff@pinedrink.vn', status: 'Active' }
  ];
}
