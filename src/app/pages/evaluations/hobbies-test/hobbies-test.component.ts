import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
export class HobbiesTestComponent {
  constructor(private router: Router, private authService: AuthService) {}

  cards: HobbyCard[] = [
    { id: '1', text: 'Construir bases y estructuras', category: 'ingenieria' },
    { id: '2', text: 'Gestionar recursos limitados', category: 'matematicas' },
    { id: '3', text: 'Diseñar personajes o escenarios', category: 'artes' },
    { id: '4', text: 'Resolver puzzles lógicos', category: 'ciencia' },
    { id: '5', text: 'Modding o programar scripts', category: 'tecnologia' },
    { id: '6', text: 'Optimizar rutas o procesos', category: 'ingenieria' }
  ];

  currentIndex = 0;
  answers: Record<string, 'liked' | 'disliked'> = {};
  animatingOut: 'left' | 'right' | null = null;

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
    localStorage.setItem(`mission2_answers_${userId}`, JSON.stringify(this.answers));
    
    // In a real scenario, this might also call an API to save mission progress
    
    // Navigate back to Dashboard
    this.router.navigate(['/dashboard']);
  }
}
