import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VocationalProfileService } from '../../../core/services/vocational-profile.service';
import { CalibrationDeckService } from '../../../core/services/calibration-deck.service';
import { CalibrationModuleResult, SimulatorAffinityResult, SteamAxis } from '../../../core/models/vocational-profile.models';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

interface HobbyCard {
  id: string;
  text: string;
  category: string;
}

@Component({
  selector: 'app-hobbies-test',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './hobbies-test.component.html',
  styleUrls: ['./hobbies-test.component.scss']
})
export class HobbiesTestComponent implements OnInit {
  moduleId = '';
  moduleTitle = '';
  moduleSubtitle = '';
  cards: HobbyCard[] = [];
  currentIndex = 0;
  answers: Record<string, 'liked' | 'disliked'> = {};
  animatingOut: 'left' | 'right' | null = null;
  viewState: 'intro' | 'swiping' | 'outro' = 'intro';
  isSubmitting = false;

  /** Resumen de la contribución de este módulo al perfil (para mostrar en el outro). */
  calibrationSummary: { axis: string; label: string; liked: number; disliked: number }[] = [];

  allDecks: Record<string, { title: string; subtitle: string; cards: HobbyCard[] }> = {
    gaming_habits: {
      title: 'Hábitos de Gaming',
      subtitle: '¿Qué tipo de decisiones y mecánicas prefieres cuando juegas?',
      cards: [
        { id: 'gh1', text: 'Colaborar en equipo para planificar estrategias en tiempo real', category: 'ingenieria' },
        { id: 'gh2', text: 'Analizar mecánicas de juego para encontrar exploits o bugs', category: 'tecnologia' },
        { id: 'gh3', text: 'Calcular el daño óptimo (min-maxing) y estadísticas de personajes', category: 'matematicas' },
        { id: 'gh4', text: 'Disfrutar de juegos de simulación científica o construcción de ciudades', category: 'ciencia' },
        { id: 'gh5', text: 'Crear mods estéticos, skins o mapas personalizados', category: 'artes' },
        { id: 'gh6', text: 'Resolver acertijos lógicos en juegos de aventura o escape room', category: 'ciencia' }
      ]
    },
    physical_hobbies: {
      title: 'Hobbies y Ecosistemas',
      subtitle: '¿Qué actividades físicas o interacciones con el entorno te apasionan?',
      cards: [
        { id: 'ph1', text: 'Cultivar plantas y monitorear su crecimiento según el suelo', category: 'ciencia' },
        { id: 'ph2', text: 'Armar o reparar dispositivos mecánicos en tu tiempo libre', category: 'ingenieria' },
        { id: 'ph3', text: 'Crear ilustraciones físicas, música o esculpir con materiales', category: 'artes' },
        { id: 'ph4', text: 'Analizar el comportamiento de la fauna local o biodiversidad', category: 'ciencia' },
        { id: 'ph5', text: 'Participar en competencias de ajedrez o resolución de problemas matemáticos', category: 'matematicas' },
        { id: 'ph6', text: 'Configurar un servidor casero o red local para compartir archivos', category: 'tecnologia' }
      ]
    },
    digital_consumption: {
      title: 'Consumo Digital',
      subtitle: '¿Qué tipo de contenido e información consumes en tus dispositivos?',
      cards: [
        { id: 'dc1', text: 'Ver documentales sobre astronomía, física cuántica o biología', category: 'ciencia' },
        { id: 'dc2', text: 'Seguir tutoriales de programación, automatización o nuevos softwares', category: 'tecnologia' },
        { id: 'dc3', text: 'Consumir contenido de análisis de diseño, animación o artes digitales', category: 'artes' },
        { id: 'dc4', text: 'Seguir creadores que explican fallas de ingeniería o grandes construcciones', category: 'ingenieria' },
        { id: 'dc5', text: 'Leer hilos explicativos sobre criptografía, economía o teoría de juegos', category: 'matematicas' },
        { id: 'dc6', text: 'Investigar cómo funcionan los algoritmos de recomendación en redes sociales', category: 'tecnologia' }
      ]
    },
    everyday_mechanics: {
      title: 'Resolución Doméstica',
      subtitle: '¿Cómo afrontas los retos técnicos y de organización en tu hogar?',
      cards: [
        { id: 'em1', text: 'Reparar electrodomésticos o conexiones eléctricas en el hogar', category: 'ingenieria' },
        { id: 'em2', text: 'Instalar y configurar sistemas de domótica (luces, asistentes de voz)', category: 'tecnologia' },
        { id: 'em3', text: 'Optimizar el consumo de energía y agua analizando los recibos', category: 'matematicas' },
        { id: 'em4', text: 'Decorar, pintar o rediseñar la distribución estética de tu habitación', category: 'artes' },
        { id: 'em5', text: 'Preparar recetas experimentando con proporciones químicas y temperaturas', category: 'ciencia' },
        { id: 'em6', text: 'Diseñar un sistema eficiente de organización o almacenamiento en casa', category: 'ingenieria' }
      ]
    }
  };

  private readonly AXIS_LABELS: Record<string, string> = {
    ciencia: 'Ciencia', tecnologia: 'Tecnología',
    ingenieria: 'Ingeniería', artes: 'Artes', matematicas: 'Matemáticas',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private profileEngine: VocationalProfileService,
    private deckService: CalibrationDeckService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || 'gaming_habits';
      this.moduleId = id;
      this.currentIndex = 0;
      this.answers = {};
      this.viewState = 'intro';
      this.calibrationSummary = [];

      // Fuente de verdad: el deck administrado en la BD. Si la API falla
      // (p. ej. sin conexión) usamos el deck hardcodeado como respaldo.
      this.deckService.getDeck(id).subscribe({
        next: (deck) => this.applyDeck(deck.title, deck.subtitle, deck.cards as HobbyCard[]),
        error: () => {
          const fallback = this.allDecks[id] || this.allDecks['gaming_habits'];
          this.applyDeck(fallback.title, fallback.subtitle, fallback.cards);
        },
      });
    });
  }

  private applyDeck(title: string, subtitle: string, cards: HobbyCard[]) {
    this.moduleTitle = title;
    this.moduleSubtitle = subtitle;
    this.cards = cards;
  }

  get currentCard(): HobbyCard | undefined {
    return this.cards[this.currentIndex];
  }

  startModule() {
    this.viewState = 'swiping';
  }

  swipe(direction: 'left' | 'right') {
    if (this.animatingOut || !this.currentCard) return;
    this.animatingOut = direction;
    this.answers[this.currentCard.id] = direction === 'right' ? 'liked' : 'disliked';
    setTimeout(() => {
      this.currentIndex++;
      this.animatingOut = null;
      if (this.currentIndex >= this.cards.length) this.finish();
    }, 400);
  }

  finish() {
    this.viewState = 'outro';
    this.isSubmitting = true;

    // 1. Espejo local (resumen del outro + soporte offline)
    const moduleResult = this.saveCalibrationLocal();

    // 2. La API guarda el módulo (A2) y recomputa el perfil completo (A4).
    //    El perfil recomputado queda cacheado por el servicio.
    this.profileEngine.submitCalibrationModule(moduleResult).subscribe({
      next: () => {
        this.authService.completeCalibrationModule(this.moduleId);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error al sincronizar calibración con la API:', err);
        // Fallback offline: recomputamos localmente para que el dashboard
        // refleje la nueva señal aunque no haya conexión.
        this.recomputeProfile();
        this.isSubmitting = false;
      }
    });
  }

  exitModule() {
    this.router.navigate(['/dashboard']);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convierte las respuestas del swipe deck al formato CalibrationModuleResult
   * (el contrato de POST /calibration/submit) y guarda un espejo local.
   */
  private saveCalibrationLocal(): CalibrationModuleResult {
    const moduleResult: CalibrationModuleResult = {
      moduleId: this.moduleId,
      answers: this.cards
        .filter(card => this.answers[card.id] !== undefined)
        .map(card => ({
          axis: card.category as SteamAxis,
          liked: this.answers[card.id] === 'liked',
        })),
    };

    const userId = this.authService.getCurrentUser()?.id;
    if (userId) {
      const key = `calibration_results_${userId}`;
      try {
        const existing: CalibrationModuleResult[] = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = existing.findIndex(r => r.moduleId === this.moduleId);
        if (idx >= 0) existing[idx] = moduleResult; else existing.push(moduleResult);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch { /* ignore storage errors */ }
    }

    // Generar resumen para el outro
    this.calibrationSummary = this.buildSummary(moduleResult);
    return moduleResult;
  }

  /**
   * Recomputa el VocationalProfile completo (teórico + calibración + simuladores)
   * y lo actualiza en localStorage para que el dashboard y los resultados lo reflejen.
   */
  private recomputeProfile(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;
    try {
      const scoresRaw = localStorage.getItem(`test_theoretical_scores_${userId}`);
      if (!scoresRaw) return; // Sin test teórico previo no hay perfil base

      const theoreticalScores = JSON.parse(scoresRaw);
      const calibrationResults: CalibrationModuleResult[] = JSON.parse(
        localStorage.getItem(`calibration_results_${userId}`) || '[]'
      );
      const simulatorResults: SimulatorAffinityResult[] = JSON.parse(
        localStorage.getItem(`simulator_results_${userId}`) || '[]'
      );

      const profile = this.profileEngine.computeProfile(
        theoreticalScores, calibrationResults, simulatorResults
      );
      this.profileEngine.cacheProfile(profile);
    } catch { /* ignore */ }
  }

  /** Agrupa los resultados por eje para mostrar en el outro. */
  private buildSummary(result: CalibrationModuleResult) {
    const acc: Record<string, { liked: number; disliked: number }> = {};
    for (const ans of result.answers) {
      if (!acc[ans.axis]) acc[ans.axis] = { liked: 0, disliked: 0 };
      ans.liked ? acc[ans.axis].liked++ : acc[ans.axis].disliked++;
    }
    return Object.entries(acc)
      .filter(([, c]) => c.liked + c.disliked > 0)
      .sort(([, a], [, b]) => b.liked - a.liked)
      .map(([axis, c]) => ({
        axis,
        label: this.AXIS_LABELS[axis] || axis,
        liked: c.liked,
        disliked: c.disliked,
      }));
  }
}
