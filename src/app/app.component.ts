import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { ToastComponent } from './components/toast/toast.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ThemeService } from './core/services/theme.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreenComponent, ToastComponent, NavbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'steam-vocation-pwa';
  private swUpdate = inject(SwUpdate);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  showNavbar = false;

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
        if (confirm('Hay una nueva versión de STEAM Vocations disponible. ¿Deseas actualizar ahora?')) {
          window.location.reload();
        }
      });
    }
  }
}
