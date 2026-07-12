import { Component } from '@angular/core';
import { LanguageService } from './core/services/language.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private languageService: LanguageService,
    private authService: AuthService
  ) {
    this.authService.bootstrapCurrentUser().subscribe();
  }
}
