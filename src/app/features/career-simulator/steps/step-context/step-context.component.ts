import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-step-context',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './step-context.component.html',
  styleUrls: ['./step-context.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepContextComponent {
  public step = input.required<SimulatorStep>();
  public stepCompleted = output<UserStepDecision>();

  public startSimulation() {
    this.stepCompleted.emit({
      stepId: this.step().id,
      stepType: 'CONTEXT',
      timeSpentMs: 0
    });
  }
}
