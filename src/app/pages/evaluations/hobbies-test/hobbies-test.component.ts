import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || 'gaming_habits';
      this.moduleId = id;
      const deck = this.allDecks[id] || this.allDecks['gaming_habits'];
      this.moduleTitle = deck.title;
      this.moduleSubtitle = deck.subtitle;
      this.cards = deck.cards;
      this.currentIndex = 0;
      this.answers = {};
    });
  }

  get currentCard(): HobbyCard | undefined {
    return this.cards[this.currentIndex];
  }

  swipe(direction: 'left' | 'right') {
    if (this.animatingOut || !this.currentCard) return;

    this.animatingOut = direction;
    this.answers[this.currentCard.id] = direction === 'right' ? 'liked' : 'disliked';

    setTimeout(() => {
      this.currentIndex++;
      this.animatingOut = null;
      
      if (this.currentIndex >= this.cards.length) {
        this.finish();
      }
    }, 400);
  }

  finish() {
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';
    
    // Save locally
    localStorage.setItem(`calibration_${this.moduleId}_answers_${userId}`, JSON.stringify(this.answers));
    
    // Complete calibration module
    this.authService.completeCalibrationModule(this.moduleId);
    
    // Navigate back to Dashboard
    this.router.navigate(['/dashboard']);
  }
}
