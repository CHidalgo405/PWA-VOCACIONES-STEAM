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
   * Reads from localStorage. Default is Light Mode.
   */
  initializeTheme(): void {
    const savedTheme = localStorage.getItem('app-theme');
    const isDark = savedTheme === 'dark';
    this.applyTheme(isDark);
  }

  /**
   * Directly sets and applies the theme.
   */
  setTheme(isDark: boolean): void {
    localStorage.setItem('app-theme', isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
  }

  /**
   * Aplica la preferencia de tema del servidor SOLO si el usuario todavía no
   * ha elegido un tema en este dispositivo. El toggle local siempre tiene
   * prioridad: sin esto, cada carga del perfil pisaba la elección del usuario
   * y el modo oscuro "no funcionaba" (se revertía al recargar).
   */
  syncFromServer(isDark: boolean): void {
    if (localStorage.getItem('app-theme') === null) {
      this.setTheme(isDark);
    }
  }

  /**
   * Restablece a modo claro SIN dejar preferencia persistida (p. ej. en
   * logout): así el siguiente usuario que inicie sesión hereda su propia
   * preferencia del servidor en vez de quedar forzado a claro.
   */
  resetToLight(): void {
    localStorage.removeItem('app-theme');
    this.applyTheme(false);
  }

  /** Aplica un tema visualmente sin persistirlo (p. ej. pantalla de bienvenida). */
  applyThemeOnly(isDark: boolean): void {
    this.applyTheme(isDark);
  }

  /** Toggles between light and dark mode and reloads the page. */
  toggleTheme(): void {
    const newValue = !this.isDarkMode$.value;
    localStorage.setItem('app-theme', newValue ? 'dark' : 'light');
    this.applyTheme(newValue);
    
    // Recargar el navegador para forzar la actualización de componentes externos (ej. Mapas)
    setTimeout(() => {
      window.location.reload();
    }, 100);
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
