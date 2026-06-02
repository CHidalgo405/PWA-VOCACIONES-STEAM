import { Component, ChangeDetectionStrategy, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-step-ai-feedback',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './step-ai-feedback.component.html',
  styleUrls: ['./step-ai-feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepAIFeedbackComponent implements OnInit {
  public step = input.required<SimulatorStep>();
  public stepCompleted = output<UserStepDecision>();

  ngOnInit() {
    // In a real scenario, this step would wait for an external service (simulator.service) 
    // to finish the HTTP request to the AI and then automatically proceed or show the results.
    // Since this is a local demo, we'll auto-advance after a few seconds, or let the user click.
  }

  public continue() {
    this.stepCompleted.emit({
      stepId: this.step().id,
      stepType: 'AI_FEEDBACK',
      timeSpentMs: 0
    });
  }
}
