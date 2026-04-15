import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly STORAGE_KEY = 'theme-preference';
  private readonly DARK_CLASS = 'dark-theme';

  /** Observable that emits true when dark mode is active */
  isDarkMode$ = new BehaviorSubject<boolean>(false);

  /**
   * Reads the stored preference from localStorage and applies the theme.
   * Defaults to Light Mode if no preference is found.
   * Should be called once from AppComponent.ngOnInit().
   */
  initializeTheme(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const isDark = stored === 'dark';
    this.applyTheme(isDark);
  }

  /** Toggles between light and dark mode, persisting the choice. */
  toggleTheme(): void {
    const newValue = !this.isDarkMode$.value;
    this.applyTheme(newValue);
    localStorage.setItem(this.STORAGE_KEY, newValue ? 'dark' : 'light');
  }

  /** Returns the current dark-mode state synchronously. */
  get isDark(): boolean {
    return this.isDarkMode$.value;
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add(this.DARK_CLASS);
    } else {
      document.body.classList.remove(this.DARK_CLASS);
    }
    this.isDarkMode$.next(isDark);
  }
}
