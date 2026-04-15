import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { ToastComponent } from './components/toast/toast.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashScreenComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'steam-vocation-pwa';
  private swUpdate = inject(SwUpdate);
  private themeService = inject(ThemeService);

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
