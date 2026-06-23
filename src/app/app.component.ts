import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { ToastComponent } from './components/toast/toast.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ThemeService } from './core/services/theme.service';
import { DialogService } from './core/services/dialog.service';
import { NgIf } from '@angular/common';
import { fadeSlideAnimation } from './route-animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreenComponent, ToastComponent, DialogComponent, NavbarComponent, NgIf],
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
