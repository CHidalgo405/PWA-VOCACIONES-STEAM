import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';

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
  @Output() completed = new EventEmitter<any>();

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
    this.completed.emit(this.answers);
  }
}
