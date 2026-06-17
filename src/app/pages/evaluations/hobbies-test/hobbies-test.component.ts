import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { LocalVocationalCalibrationService } from '../../../core/services/local-vocational-calibration.service';
import type {
  CalibrationAnswerValue,
  CalibrationExperienceCard
} from '../../../core/models/vocational-steam.models';

type HobbyCard = CalibrationExperienceCard;

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
  moduleDescription = '';
  cards: HobbyCard[] = [];
  currentIndex = 0;
  answers: Record<string, CalibrationAnswerValue> = {};
  animatingOut: 'left' | 'right' | null = null;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthService,
    private localCalibrationService: LocalVocationalCalibrationService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || 'gaming_habits';
      const deck = this.localCalibrationService.getModuleById(id)
        || this.localCalibrationService.modules[0];
      this.moduleId = deck.id;
      this.moduleTitle = deck.title;
      this.moduleSubtitle = deck.subtitle;
      this.moduleDescription = deck.description;
      this.cards = deck.cards;
      this.currentIndex = 0;
      this.answers = {};
    });
  }

  get currentCard(): HobbyCard | undefined {
    return this.cards[this.currentIndex];
  }

  get progressPct(): number {
    if (!this.cards.length) return 0;
    return Math.round((this.currentIndex / this.cards.length) * 100);
  }

  swipe(direction: 'left' | 'right' | 'neutral') {
    if (this.animatingOut || !this.currentCard) return;

    this.animatingOut = direction === 'neutral' ? null : direction;
    this.answers[this.currentCard.id] = this.toAnswerValue(direction);

    setTimeout(() => {
      this.currentIndex++;
      this.animatingOut = null;
      
      if (this.currentIndex >= this.cards.length) {
        this.finish();
      }
    }, direction === 'neutral' ? 180 : 400);
  }

  finish() {
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const signalResult = this.localCalibrationService.buildSignalResult(this.moduleId, this.answers);
    if (signalResult) {
      this.localCalibrationService.saveSignalResult(userId, signalResult);
    }

    // API compatibility: "not_tried" stays local so it cannot be interpreted as a negative answer by the backend.
    const apiAnswers = this.localCalibrationService.toApiCompatibleAnswers(this.answers);
    this.authService.submitCalibration(this.moduleId, apiAnswers).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error saving calibration to backend:', err);
        this.authService.completeCalibrationModule(this.moduleId);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private toAnswerValue(direction: 'left' | 'right' | 'neutral'): CalibrationAnswerValue {
    if (direction === 'right') return 'liked';
    if (direction === 'left') return 'disliked';
    return 'not_tried';
  }
}
