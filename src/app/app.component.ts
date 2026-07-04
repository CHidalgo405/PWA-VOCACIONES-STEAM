import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, NavigationError, ChildrenOutletContexts } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { ToastComponent } from './components/toast/toast.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TermsGateComponent } from './components/terms-gate/terms-gate.component';
import { ThemeService } from './core/services/theme.service';
import { DialogService } from './core/services/dialog.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { NgIf } from '@angular/common';
import { fadeSlideAnimation } from './route-animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreenComponent, ToastComponent, DialogComponent, NavbarComponent, TermsGateComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [fadeSlideAnimation]
})
export class AppComponent implements OnInit {
  title = 'steam-vocation-pwa';
  private swUpdate = inject(SwUpdate);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private contexts = inject(ChildrenOutletContexts);
  private dialogService = inject(DialogService);
  private pwaInstallService = inject(PwaInstallService); // Initialize service

  showNavbar = false;

  constructor() {
    // Escucha los cambios de ruta para decidir si mostrar o no el navbar globalmente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Obtenemos la ruta limpia (sin query params)
      const urlWithoutQuery = event.urlAfterRedirects.split('?')[0];
      // Rutas exactas donde la barra de navegación debe estar visible
      const navRoutes = ['/dashboard', '/explore', '/history', '/profile', '/career-simulator'];
      const isNavRoute = navRoutes.includes(urlWithoutQuery);
      const isAdminRoute = event.urlAfterRedirects.includes('/admin');
      this.showNavbar = isNavRoute && !isAdminRoute;

      // Una navegación exitosa confirma que el shell ya está actualizado:
      // libera el candado de reintento para futuros fallos genuinos.
      sessionStorage.removeItem('chunk-load-retry');
    });

    // Recuperación automática de fallos al cargar un chunk lazy (loadComponent):
    // ocurre cuando el Service Worker sigue sirviendo un index.html/manifiesto
    // viejo mientras el servidor ya reemplazó los archivos de una versión más
    // reciente — la ruta lazy falla a importar y el router-outlet queda vacío
    // (pantalla en blanco) sin que Angular lo reporte de forma visible. Un
    // reload completo vuelve a pedir el shell actualizado y lo resuelve.
    this.router.events.pipe(
      filter((event): event is NavigationError => event instanceof NavigationError)
    ).subscribe((event) => {
      const message = String(event.error?.message || event.error || '');
      const isChunkLoadFailure = /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|error loading dynamically imported module/i.test(message);
      const alreadyRetried = sessionStorage.getItem('chunk-load-retry') === '1';

      if (isChunkLoadFailure && !alreadyRetried) {
        sessionStorage.setItem('chunk-load-retry', '1');
        window.location.reload();
      }
    });
  }

  ngOnInit() {
    // Initialize theme from localStorage on app startup
    this.themeService.initializeTheme();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      ).subscribe(async () => {
        const confirmed = await this.dialogService.confirm(
          'Actualización Disponible',
          'Hay una nueva versión de Vocaciones STEAM disponible. ¿Deseas actualizar ahora?',
          { confirmText: 'Actualizar', cancelText: 'Más tarde' }
        );
        if (confirmed) {
          window.location.reload();
        }
      });
    }
  }

  prepareRoute() {
    return this.contexts.getContext('primary')?.route?.snapshot?.routeConfig?.path || 'initial';
  }
}
