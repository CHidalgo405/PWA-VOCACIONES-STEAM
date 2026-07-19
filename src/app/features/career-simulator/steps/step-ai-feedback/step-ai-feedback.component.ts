import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SimulatorStep,
  UserStepDecision,
} from '../../../../core/models/career-simulator.models';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-step-reality-check',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './step-ai-feedback.component.html',
  styleUrls: ['./step-ai-feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepRealityCheckComponent {
  public step = input.required<SimulatorStep>();
  public stepCompleted = output<UserStepDecision>();

  public continue() {
    this.stepCompleted.emit({
      stepId: this.step().id,
      stepType: 'REALITY_CHECK',
      timeSpentMs: 0,
    });
  }
}
