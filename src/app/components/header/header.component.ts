import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showBack: boolean = true;
  @Input() backRoute?: string;

  private location = inject(Location);
  private router = inject(Router);

  goBack() {
    if (this.backRoute) {
      this.router.navigate([this.backRoute]);
    } else {
      this.location.back();
    }
  }
}
