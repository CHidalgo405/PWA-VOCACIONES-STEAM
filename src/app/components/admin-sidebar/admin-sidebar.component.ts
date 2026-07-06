import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';

import { PwaInstallService } from '../../core/services/pwa-install.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public pwaInstall: PwaInstallService,
    public themeService: ThemeService
  ) { }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  /** Alterna el tema al instante (el panel usa variables CSS, no hace falta recargar). */
  toggleDarkMode() {
    this.themeService.setTheme(!this.themeService.isDark);
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/login']);
  }
}