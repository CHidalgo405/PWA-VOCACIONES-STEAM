import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = false;
  private readonly THEME_KEY = 'steam_dark_theme';

  constructor() {
    this.loadTheme();
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    // Si hay preferencia guardada úsala, sino podría basarse en preferencia del sistema
    if (savedTheme === 'dark') {
      this.isDarkTheme = true;
    } else if (savedTheme === 'light') {
      this.isDarkTheme = false;
    } else {
      // Opcional: Preferencia del sistema
      this.isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem(this.THEME_KEY, this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  setTheme(isDark: boolean) {
    this.isDarkTheme = isDark;
    localStorage.setItem(this.THEME_KEY, this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  isDark(): boolean {
    return this.isDarkTheme;
  }

  private applyTheme() {
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
