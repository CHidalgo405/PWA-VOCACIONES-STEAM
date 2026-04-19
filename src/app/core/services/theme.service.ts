import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly DARK_CLASS = 'dark-theme';

  /** Observable that emits true when dark mode is active */
  isDarkMode$ = new BehaviorSubject<boolean>(false);

  /**
   * Initializes the theme. 
   * Default is Light Mode.
   */
  initializeTheme(): void {
    // We follow "Modo Claro" as default if no external signal is provided
    this.applyTheme(false);
  }

  /**
   * Directly sets and applies the theme without local persistence.
   */
  setTheme(isDark: boolean): void {
    this.applyTheme(isDark);
  }

  /** Toggles between light and dark mode. */
  toggleTheme(): void {
    const newValue = !this.isDarkMode$.value;
    this.applyTheme(newValue);
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
