import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';

export type EmptyStateTone = 'cyan' | 'orange' | 'rose';
export type EmptyStateVisual = 'history' | 'campus' | 'search';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() eyebrow = 'Siguiente paso';
  @Input() icon = 'sparkles';
  @Input() tone: EmptyStateTone = 'cyan';
  @Input() visual: EmptyStateVisual = 'search';
  @Input() compact = false;
  @Input() details: readonly string[] = [];

  @Input() primaryLabel = '';
  @Input() primaryRoute: string | any[] | null = null;
  @Input() primaryIcon = 'arrow-right';
  @Input() primaryDisabled = false;

  @Input() secondaryLabel = '';
  @Input() secondaryRoute: string | any[] | null = null;
  @Input() secondaryIcon = '';
  @Input() secondaryDisabled = false;

  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
}
