import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { VocationTestService, Question, Option, TestSubmissionResponse } from '../../core/services/test.service';
import { AuthService } from '../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
    selector: 'app-vocation-test',
    standalone: true,
    imports: [CommonModule, DecimalPipe, SplashScreenComponent, LucideIconComponent],
    templateUrl: './vocation-test.component.html',
    styleUrls: ['./vocation-test.component.scss']
})
export class VocationTestComponent implements OnInit {

    // Test states: 'onboarding' | 'questionnaire' | 'analyzing'
    viewState: 'onboarding' | 'questionnaire' | 'analyzing' = 'onboarding';

    // Questions Data
    questions: Question[] = [];
    isLoadingQuestions = true;
    loadingError = '';

    currentQuestionIndex: number = 0;
    selectedOptionId: string | null = null;
    profileScores: Record<string, number> = {
        ciencia: 0,
        tecnologia: 0,
        ingenieria: 0,
        artes: 0,
        matematicas: 0
    };

    showAlert: boolean = false;
    showExitModal: boolean = false;

    /** Controls the slide-in transition when switching questions */
    isAnimating: boolean = false;

    userAnswers: Record<string, string> = {};

    constructor(
        private router: Router,
        private testService: VocationTestService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.testService.getQuestions().pipe(
            catchError(err => {
                this.loadingError = 'Error al cargar las preguntas del test.';
                console.error(err);
                return of([]);
            })
        ).subscribe(data => {
            this.questions = data;
            this.isLoadingQuestions = false;
        });
    }

    startTest() {
        this.viewState = 'questionnaire';
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.resetScores();
    }

    resetScores() {
        this.profileScores = {
            ciencia: 0,
            tecnologia: 0,
            ingenieria: 0,
            artes: 0,
            matematicas: 0
        };
    }

    get currentQuestion(): Question | undefined {
        return this.questions[this.currentQuestionIndex];
    }

    get progressPercentage(): number {
        if (!this.questions.length) return 0;
        return ((this.currentQuestionIndex) / this.questions.length) * 100;
    }

    selectOption(optionId: string) {
        this.selectedOptionId = optionId;
        this.showAlert = false;
    }

    nextQuestion() {
        if (!this.selectedOptionId) {
            this.showAlert = true;
            setTimeout(() => this.showAlert = false, 3000);
            return;
        }

        // Accumulate score and store answer
        const currentQ = this.currentQuestion;
        if (!currentQ) return;
        this.userAnswers[currentQ.id.toString()] = this.selectedOptionId;

        const selectedOption = currentQ.options.find(o => o.id === this.selectedOptionId);
        if (selectedOption) {
            const tagKey = selectedOption.steamTrait
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            if (this.profileScores[tagKey] !== undefined) {
                this.profileScores[tagKey]++;
            }
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            // Trigger slide-in animation for the next question
            this.triggerTransition(() => {
                this.currentQuestionIndex++;
                this.selectedOptionId = null;
            });
        } else {
            this.finishTest();
        }
    }

    /** Briefly removes then re-adds the animation class for smooth transitions */
    private triggerTransition(callback: () => void) {
        this.isAnimating = false;
        // Allow one frame for the class removal to register
        requestAnimationFrame(() => {
            callback();
            requestAnimationFrame(() => {
                this.isAnimating = true;
                // Remove class after animation completes so it can re-trigger next time
                setTimeout(() => { this.isAnimating = false; }, 400);
            });
        });
    }

    finishTest() {
        this.viewState = 'analyzing';

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            localStorage.setItem(`hasTakenTest_${user.id}`, 'true');
        }
        
        // Save answers so the results page can call the API
        localStorage.setItem('latest_test_answers', JSON.stringify(this.userAnswers));

        // Simulate a brief delay before navigating
        setTimeout(() => {
            this.router.navigate(['/test-result']);
        }, 1500);
    }

    promptExit() {
        this.showExitModal = true;
    }

    cancelExit() {
        this.showExitModal = false;
    }

    confirmExit() {
        this.showExitModal = false;
        this.router.navigate(['/dashboard']);
    }
}
