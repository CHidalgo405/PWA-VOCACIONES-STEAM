import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { CareerSimulatorData, SimulatorStep, SimulatorStepOption } from '../../../core/models/career-simulator.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-manage-simulators',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-simulators.component.html',
  styleUrls: ['./manage-simulators.component.scss']
})
export class ManageSimulatorsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State Signals
  public simulators = signal<any[]>([]);
  public isLoading = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public isModalOpen = signal<boolean>(false);
  public modalMode = signal<'create' | 'edit' | 'view'>('view');
  
  // Search and filter
  public searchTerm = '';
  public filterArea = '';
  public activeTab = signal<number>(0); // Step tab active index

  // Form State
  public currentSimulatorId = '';
  public formModel = {
    careerId: '',
    careerName: '',
    description: '',
    steamAreaName: 'Tecnología' as 'Ciencia' | 'Tecnología' | 'Ingeniería' | 'Artes' | 'Matemáticas',
    areaClass: 'steam-tecnologia',
    areaEmoji: '💻',
    steps: [] as SimulatorStep[]
  };

  // Helper for tab names
  public stepTypes = [
    { label: '1. Contexto', type: 'CONTEXT' },
    { label: '2. Análisis', type: 'DATA_ANALYSIS' },
    { label: '3. Dilema', type: 'TRADEOFF_DECISION' },
    { label: '4. Sorpresa', type: 'SURPRISE_REVEAL' },
    { label: '5. IA Feedback', type: 'AI_FEEDBACK' },
    { label: '6. Reflexión', type: 'EMOTIONAL_REFLECTION' }
  ];

  ngOnInit() {
    this.loadSimulators();
  }

  public loadSimulators() {
    this.isLoading.set(true);
    this.adminService.getAdminSimulators().subscribe({
      next: (data) => {
        this.simulators.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading simulators:', err);
        this.toastService.showToast('No se pudieron cargar los simuladores del servidor.', 'error', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  // Pre-filled template steps complying with 6 steps rule
  private createDefaultSteps(careerId: string): SimulatorStep[] {
    const cid = careerId || 'new_sim';
    return [
      { id: `${cid}_step_1_context`, type: 'CONTEXT', title: 'Contexto del Reto', content: '' },
      { 
        id: `${cid}_step_2_data`, 
        type: 'DATA_ANALYSIS', 
        title: 'Análisis de Datos', 
        content: '', 
        options: [
          { id: `${cid}_opt_d1`, text: 'Opción A', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_opt_d2`, text: 'Opción B', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } }
        ] 
      },
      { 
        id: `${cid}_step_3_tradeoff`, 
        type: 'TRADEOFF_DECISION', 
        title: 'Decisión Crítica', 
        content: '', 
        options: [
          { id: `${cid}_opt_t1`, text: 'Acción Rápida', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_opt_t2`, text: 'Acción Segura', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } }
        ] 
      },
      { id: `${cid}_step_4_surprise`, type: 'SURPRISE_REVEAL', title: 'Revelación Realista', content: '' },
      { id: `${cid}_step_5_ai`, type: 'AI_FEEDBACK', title: 'Evaluación del Sistema', content: 'Procesando tu razonamiento lógico y decisiones estratégicas...' },
      { 
        id: `${cid}_step_6_emotional`, 
        type: 'EMOTIONAL_REFLECTION', 
        title: 'Reflexión Final', 
        content: '¿Cómo te sentiste ante este reto de toma de decisiones?', 
        options: [
          { id: `${cid}_emo_1`, text: '1 - Muy abrumada/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_emo_2`, text: '2 - Estresada/o pero resolutivo', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_emo_3`, text: '3 - Neutral', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_emo_4`, text: '4 - Cómoda/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: `${cid}_emo_5`, text: '5 - En mi elemento', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } }
        ] 
      }
    ];
  }

  public openModal(mode: 'create' | 'edit' | 'view', sim?: any) {
    this.modalMode.set(mode);
    this.activeTab.set(0);

    if (mode === 'create') {
      this.currentSimulatorId = '';
      this.formModel = {
        careerId: '',
        careerName: '',
        description: '',
        steamAreaName: 'Tecnología',
        areaClass: 'steam-tecnologia',
        areaEmoji: '💻',
        steps: this.createDefaultSteps('new_sim')
      };
    } else if (sim) {
      this.currentSimulatorId = sim.id;
      // Map existing simulator to form model
      this.formModel = {
        careerId: sim.careerId || sim.id,
        careerName: sim.careerName,
        description: sim.description,
        steamAreaName: sim.steamAreaName || 'Tecnología',
        areaClass: sim.areaClass || this.inferAreaClass(sim.steamAreaName),
        areaEmoji: sim.areaEmoji || this.inferAreaEmoji(sim.steamAreaName),
        steps: JSON.parse(JSON.stringify(sim.steps || [])) // deep copy
      };
      
      // If for some reason the simulator doesn't have 6 steps, fill them in
      if (this.formModel.steps.length < 6) {
        const defaults = this.createDefaultSteps(this.formModel.careerId);
        for (let i = this.formModel.steps.length; i < 6; i++) {
          this.formModel.steps.push(defaults[i]);
        }
      }
    }
    
    this.isModalOpen.set(true);
  }

  public closeModal() {
    this.isModalOpen.set(false);
  }

  public onAreaChange() {
    this.formModel.areaClass = this.inferAreaClass(this.formModel.steamAreaName);
    this.formModel.areaEmoji = this.inferAreaEmoji(this.formModel.steamAreaName);
  }

  private inferAreaClass(steamAreaName: string): string {
    const area = (steamAreaName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (area.includes('ciencia')) return 'steam-ciencia';
    if (area.includes('tecnologia')) return 'steam-tecnologia';
    if (area.includes('ingenieria')) return 'steam-ingenieria';
    if (area.includes('arte')) return 'steam-arte';
    if (area.includes('matematica')) return 'steam-matematicas';
    return 'steam-tecnologia';
  }

  private inferAreaEmoji(steamAreaName: string): string {
    const area = (steamAreaName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (area.includes('ciencia')) return '🔬';
    if (area.includes('tecnologia')) return '💻';
    if (area.includes('ingenieria')) return '🏗️';
    if (area.includes('arte')) return '🎨';
    if (area.includes('matematica')) return '🧮';
    return '💻';
  }

  // Options CRUD inside steps
  public addOption(stepIndex: number) {
    const step = this.formModel.steps[stepIndex];
    if (!step.options) step.options = [];
    
    const count = step.options.length + 1;
    step.options.push({
      id: `${this.formModel.careerId || 'new'}_opt_${stepIndex}_${Date.now()}`,
      text: `Nueva Opción ${count}`,
      steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 }
    });
  }

  public removeOption(stepIndex: number, optionIndex: number) {
    const step = this.formModel.steps[stepIndex];
    if (step.options) {
      step.options.splice(optionIndex, 1);
    }
  }

  // Save changes
  public saveSimulator() {
    if (!this.formModel.careerId || !this.formModel.careerName) {
      this.toastService.showToast('El ID y Nombre son campos requeridos.', 'warning', 'Advertencia');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      ...this.formModel,
      steps: this.formModel.steps.map((s, idx) => {
        // Enforce correct order of types
        s.type = this.stepTypes[idx].type as any;
        return s;
      })
    };

    if (this.modalMode() === 'create') {
      this.adminService.createSimulator(payload).subscribe({
        next: () => {
          this.toastService.showToast('Simulador creado exitosamente.', 'success', 'Éxito');
          this.loadSimulators();
          this.isModalOpen.set(false);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error creating simulator:', err);
          this.toastService.showToast('No se pudo crear el simulador.', 'error', 'Error');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.adminService.updateSimulator(this.currentSimulatorId, payload).subscribe({
        next: () => {
          this.toastService.showToast('Simulador actualizado exitosamente.', 'success', 'Éxito');
          this.loadSimulators();
          this.isModalOpen.set(false);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error updating simulator:', err);
          this.toastService.showToast('No se pudo actualizar el simulador.', 'error', 'Error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  public deleteSimulator(sim: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar el simulador "${sim.careerName}"?`)) {
      this.isLoading.set(true);
      this.adminService.deleteSimulator(sim.id).subscribe({
        next: () => {
          this.toastService.showToast('Simulador eliminado exitosamente.', 'success', 'Éxito');
          this.loadSimulators();
        },
        error: (err) => {
          console.error('Error deleting simulator:', err);
          this.toastService.showToast('No se pudo eliminar el simulador.', 'error', 'Error');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Filter helper
  public get filteredSimulatorsList() {
    return this.simulators().filter(sim => {
      const matchSearch = sim.careerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          (sim.careerId || sim.id).toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchArea = !this.filterArea || sim.steamAreaName === this.filterArea;
      return matchSearch && matchArea;
    });
  }
}
