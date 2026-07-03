import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  POLICY_EFFECTIVE_DATE,
  POLICY_LAST_UPDATED,
  POLICY_VERSION,
  LEGAL_ENTITY,
} from '../../../core/legal/legal.constants';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './terms.component.html',
  styleUrls: ['../legal-page.scss'],
})
export class TermsComponent {
  private location = inject(Location);
  readonly effectiveDate = POLICY_EFFECTIVE_DATE;
  readonly lastUpdated = POLICY_LAST_UPDATED;
  readonly version = POLICY_VERSION;
  readonly legal = LEGAL_ENTITY;

  goBack(): void {
    this.location.back();
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
