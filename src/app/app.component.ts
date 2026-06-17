import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { ToastComponent } from './components/toast/toast.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ThemeService } from './core/services/theme.service';
import { ToastService } from './core/services/toast.service';
import { NgIf } from '@angular/common';
import { fadeSlideAnimation } from './route-animations';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreenComponent, ToastComponent, NavbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [fadeSlideAnimation]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Vocaciones STEAM';
  private swUpdate = inject(SwUpdate);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private contexts = inject(ChildrenOutletContexts);
  private readonly installDismissedStorageKey = 'steam_pwa_install_dismissed_at';
  private readonly installDismissCooldownMs = 7 * 24 * 60 * 60 * 1000;
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  showNavbar = false;
  isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  showInstallBanner = false;
  updateAvailable = false;

  constructor() {
    // Escucha los cambios de ruta para decidir si mostrar o no el navbar globalmente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Rutas donde la barra de navegación debe estar visible
      const navRoutes = ['/dashboard', '/explore', '/history', '/profile', '/test-result'];
      const isNavRoute = navRoutes.some(route => event.urlAfterRedirects.includes(route));
      const isAdminRoute = event.urlAfterRedirects.includes('/admin');
      this.showNavbar = isNavRoute && !isAdminRoute;
    });
  }

  ngOnInit() {
    // Initialize theme from localStorage on app startup
    this.themeService.initializeTheme();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        this.updateAvailable = true;
      });
    }

    this.setupPwaExperienceListeners();
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt as EventListener);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
  }

  prepareRoute() {
    return this.contexts.getContext('primary')?.route?.snapshot?.routeConfig?.path || 'initial';
  }

  async installApp(): Promise<void> {
    if (!this.deferredInstallPrompt) return;

    await this.deferredInstallPrompt.prompt();
    const choice = await this.deferredInstallPrompt.userChoice;

    this.showInstallBanner = false;
    this.deferredInstallPrompt = null;

    if (choice.outcome === 'accepted') {
      this.toastService.showToast('La app quedó lista para abrirse como PWA.', 'success', 'Instalada');
    } else {
      this.rememberInstallDismissal();
    }
  }

  dismissInstallBanner(): void {
    this.showInstallBanner = false;
    this.deferredInstallPrompt = null;
    this.rememberInstallDismissal();
  }

  reloadForUpdate(): void {
    window.location.reload();
  }

  private setupPwaExperienceListeners(): void {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.toastService.showToast('Conexión recuperada. Puedes seguir usando la app.', 'success');
  };

  private handleOffline = (): void => {
    this.isOnline = false;
  };

  private handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    if (this.isStandaloneMode() || this.wasInstallRecentlyDismissed()) {
      return;
    }
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    this.showInstallBanner = true;
  };

  private handleAppInstalled = (): void => {
    this.showInstallBanner = false;
    this.deferredInstallPrompt = null;
    localStorage.removeItem(this.installDismissedStorageKey);
    this.toastService.showToast('Vocaciones STEAM se instaló correctamente.', 'success', 'PWA lista');
  };

  private isStandaloneMode(): boolean {
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
  }

  private wasInstallRecentlyDismissed(): boolean {
    const rawValue = localStorage.getItem(this.installDismissedStorageKey);
    const dismissedAt = rawValue ? Number(rawValue) : 0;
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < this.installDismissCooldownMs;
  }

  private rememberInstallDismissal(): void {
    localStorage.setItem(this.installDismissedStorageKey, String(Date.now()));
  }
}
