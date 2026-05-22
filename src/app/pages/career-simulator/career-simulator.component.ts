import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

interface ChatMessage {
  role: 'ai' | 'user' | 'system';
  text: string;
}

@Component({
  selector: 'app-career-simulator',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './career-simulator.component.html',
  styleUrls: ['./career-simulator.component.scss']
})
export class CareerSimulatorComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  careerId: string = '';
  phase: 'intro' | 'chat' | 'camera' | 'analyzing' | 'success' = 'intro';
  
  messages: ChatMessage[] = [];
  chatOptions: string[] = [];

  stream: MediaStream | null = null;
  photoDataUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.careerId = this.route.snapshot.paramMap.get('id') || 'desconocida';
    
    // Simulate terminal boot
    setTimeout(() => {
      this.messages.push({ role: 'system', text: `INICIALIZANDO SIMULADOR: PERFIL [${this.careerId.toUpperCase()}]` });
    }, 500);

    setTimeout(() => {
      this.phase = 'chat';
      this.startShadowing();
    }, 2000);
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  startShadowing() {
    const isTech = this.careerId.includes('software') || this.careerId.includes('sistemas') || this.careerId.includes('tecnologia');
    
    const dilemma = isTech 
      ? "Alerta Crítica: El nodo principal del servidor ha caído a las 3:00 AM. Los usuarios reportan pérdida de datos. ¿Cuál es tu primera acción?"
      : `Situación de Campo: Ha surgido un imprevisto en tu proyecto de ${this.careerId.replace(/-/g, ' ')}. El cliente exige una respuesta inmediata. ¿Cómo procedes?`;
      
    this.messages.push({ role: 'ai', text: dilemma });

    if (isTech) {
      this.chatOptions = [
        "A) Reiniciar el servidor ciegamente",
        "B) Revisar los logs de error primero",
        "C) Llamar al arquitecto Senior"
      ];
    } else {
      this.chatOptions = [
        "A) Aplicar el protocolo de contingencia estándar",
        "B) Analizar la causa raíz antes de actuar",
        "C) Escalar el problema a la gerencia"
      ];
    }
  }

  selectOption(option: string) {
    this.messages.push({ role: 'user', text: option });
    this.chatOptions = [];

    setTimeout(() => {
      let response = "Interesante elección. Evaluar el riesgo antes de actuar es clave en esta profesión.";
      if (option.startsWith('A')) response = "Acción rápida. En situaciones de crisis, el tiempo es vital, aunque conlleva riesgos.";
      if (option.startsWith('C')) response = "Delegar es válido, pero un buen profesional debe saber cuándo resolver por sí mismo.";
      
      this.messages.push({ role: 'ai', text: response });
      
      setTimeout(() => {
        this.messages.push({ role: 'system', text: 'FASE 1 COMPLETADA. INICIANDO FASE 2: MISIÓN DE CAMPO.' });
        
        setTimeout(() => {
          this.phase = 'camera';
          // Ensure view has updated before initializing camera
          setTimeout(() => this.initCamera(), 100);
        }, 1500);
      }, 2000);

    }, 1000);
  }

  async initCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback if no camera
      this.messages.push({ role: 'system', text: 'ERROR DE HARDWARE: Cámara no detectada. Omitiendo paso biométrico...' });
      setTimeout(() => this.finishSimulation(), 2000);
    }
  }

  takePhoto() {
    if (!this.videoElement || !this.canvasElement) return;
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.photoDataUrl = canvas.toDataURL('image/jpeg');
    }
    
    this.stopCamera();
    this.phase = 'analyzing';

    setTimeout(() => {
      this.finishSimulation();
    }, 3000); // Fake analyzing time
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  finishSimulation() {
    this.phase = 'success';
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      localStorage.setItem(`simulator_completed_${user.id}`, 'true');
    }
  }

  goToExplore() {
    this.router.navigate(['/explore']);
  }
}
