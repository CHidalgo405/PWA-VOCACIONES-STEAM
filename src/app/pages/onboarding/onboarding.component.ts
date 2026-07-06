import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    // La bienvenida se ve en claro por diseño, pero NO persistimos la
    // preferencia: así no pisamos el tema que el usuario elija al entrar.
    this.themeService.applyThemeOnly(false);
  }
}