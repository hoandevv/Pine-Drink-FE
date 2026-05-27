import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'pine-drink-language';
  
  public readonly availableLanguages: Language[] = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  constructor(private translate: TranslateService) {
    this.initLanguage();
  }

  private initLanguage(): void {
    // Get saved language or use default
    const savedLanguage = this.getSavedLanguage();
    const defaultLanguage = savedLanguage || 'vi';
    
    // Set available languages
    this.translate.addLangs(this.availableLanguages.map(lang => lang.code));
    
    // Set default and current language
    this.translate.setDefaultLang('vi');
    this.translate.use(defaultLanguage);
  }

  public getCurrentLanguage(): string {
    return this.translate.currentLang || this.translate.defaultLang;
  }

  public getCurrentLanguageInfo(): Language | undefined {
    const currentCode = this.getCurrentLanguage();
    return this.availableLanguages.find(lang => lang.code === currentCode);
  }

  public setLanguage(languageCode: string): void {
    if (this.availableLanguages.some(lang => lang.code === languageCode)) {
      this.translate.use(languageCode);
      this.saveLanguage(languageCode);
    }
  }

  public switchLanguage(): void {
    const currentLang = this.getCurrentLanguage();
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    this.setLanguage(newLang);
  }

  private getSavedLanguage(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  private saveLanguage(languageCode: string): void {
    localStorage.setItem(this.STORAGE_KEY, languageCode);
  }

  public getTranslation(key: string): string {
    return this.translate.instant(key);
  }
}
