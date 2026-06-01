import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';

export interface TradeoffStep extends SimulatorStep {
  // Option structure inside includes metadata.consecuencias_positivas etc.
}

@Component({
  selector: 'app-step-tradeoff-decision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-tradeoff-decision.component.html',
  styleUrls: ['./step-tradeoff-decision.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', minHeight: '0', padding: '0', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
    trigger('successPing', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ])
    ])
  ]
})
export class StepTradeoffDecisionComponent {
  public step = input.required<TradeoffStep>();
  public stepCompleted = output<UserStepDecision>();

  public expandedOptionId = signal<string | null>(null);
  public confirmingId = signal<string | null>(null);

  public toggleOption(id: string) {
    if (this.confirmingId()) return; // Bloquear toggle durante la animación final
    
    if (this.expandedOptionId() === id) {
      this.expandedOptionId.set(null);
    } else {
      this.expandedOptionId.set(id);
    }
  }

  public selectTradeoff(id: string, event: Event) {
    event.stopPropagation();
    this.confirmingId.set(id);
    
    // Mostrar micro-animación de confirmación por 1.5s
    setTimeout(() => {
      this.stepCompleted.emit({
        stepId: this.step().id,
        stepType: 'TRADEOFF_DECISION',
        selectedOptionId: id,
        timeSpentMs: 0 // Inyectado por el servicio en base al timer real
      });
    }, 1500);
  }
}
