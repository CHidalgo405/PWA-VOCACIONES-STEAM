import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-step-emotional-reflection',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './step-emotional-reflection.component.html',
  styleUrls: ['./step-emotional-reflection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepEmotionalReflectionComponent {
  public step = input.required<SimulatorStep>();
  public stepCompleted = output<UserStepDecision>();

  public selectedOptionId = signal<string | null>(null);

  public selectOption(id: string) {
    if (this.selectedOptionId() === id) {
      this.selectedOptionId.set(null);
    } else {
      this.selectedOptionId.set(id);
    }
  }

  public finishReflection() {
    const optionId = this.selectedOptionId();
    if (optionId) {
      this.stepCompleted.emit({
        stepId: this.step().id,
        stepType: 'EMOTIONAL_REFLECTION',
        selectedOptionId: optionId,
        timeSpentMs: 0
      });
    }
  }
}
