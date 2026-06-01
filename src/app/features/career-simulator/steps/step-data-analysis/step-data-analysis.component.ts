import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulatorStep, UserStepDecision } from '../../../../core/models/career-simulator.models';

export interface DataAnalysisStep extends SimulatorStep {
  metadata?: {
    dataType?: 'TABLE' | 'BAR_CHART';
    chartData?: any[];
    [key: string]: any;
  };
}

@Component({
  selector: 'app-step-data-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-data-analysis.component.html',
  styleUrls: ['./step-data-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepDataAnalysisComponent {
  public step = input.required<DataAnalysisStep>();
  public stepCompleted = output<UserStepDecision>();

  public selectedOptionId = signal<string | null>(null);
  public reasoningText = signal<string>('');
  
  // Extraer las llaves numéricas/de datos para graficar o tabular, 
  // excluyendo las típicas de etiquetas
  public chartDataKeys = computed(() => {
    const data = this.step().metadata?.chartData;
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(k => k !== 'label' && k !== 'name' && k !== 'ciudad');
  });

  public selectOption(id: string) {
    if (this.selectedOptionId() === id) {
      this.selectedOptionId.set(null);
    } else {
      this.selectedOptionId.set(id);
    }
  }

  public updateReasoning(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.value.length <= 120) {
      this.reasoningText.set(target.value);
    } else {
      // Forzar el corte si se pasa
      target.value = target.value.substring(0, 120);
      this.reasoningText.set(target.value);
    }
  }

  public confirmAnalysis() {
    const optionId = this.selectedOptionId();
    if (optionId) {
      this.stepCompleted.emit({
        stepId: this.step().id,
        stepType: 'DATA_ANALYSIS',
        selectedOptionId: optionId,
        reasoning: this.reasoningText().trim(),
        timeSpentMs: 0 // El servicio inyectará el MS real basado en el timer
      });
    }
  }
}
