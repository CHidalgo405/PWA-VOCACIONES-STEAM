import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-step-surprise-reveal',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './step-surprise-reveal.component.html',
  styleUrls: ['./step-surprise-reveal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepSurpriseRevealComponent {
  public step = input.required<SimulatorStep>();
  public stepCompleted = output<UserStepDecision>();

  public continue() {
    this.stepCompleted.emit({
      stepId: this.step().id,
      stepType: 'SURPRISE_REVEAL',
      timeSpentMs: 0
    });
  }
}
