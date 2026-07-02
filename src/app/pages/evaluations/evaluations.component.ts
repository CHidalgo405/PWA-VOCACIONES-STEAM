import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { VocationTestService, Question } from '../../core/services/test.service';
import { AuthService } from '../../core/services/auth.service';
import { VocationalProfileService } from '../../core/services/vocational-profile.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of, timer } from 'rxjs';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
    selector: 'app-evaluations',
    standalone: true,
    imports: [CommonModule, FormsModule, DecimalPipe, SplashScreenComponent, LucideIconComponent],
    templateUrl: './evaluations.component.html',
    styleUrls: ['./evaluations.component.scss']
})
export class EvaluationsComponent implements OnInit {

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
    isTransitioningQuestion: boolean = false;

    userAnswers: Record<string, string> = {};
    isFinishing: boolean = false;

    constructor(
        private router: Router,
        private testService: VocationTestService,
        private authService: AuthService,
        private profileService: VocationalProfileService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.testService.getQuestions().pipe(
            catchError(err => {
                this.loadingError = 'Error al cargar las preguntas del test.';
                console.error(err);
                return of([]);
            })
        ).subscribe(data => {
            // Clonamos y barajamos el array para que el orden sea aleatorio en cada intento
            this.questions = this.shuffleArray([...data]);
            this.isLoadingQuestions = false;
        });
    }

    startTest() {
        this.viewState = 'questionnaire';
        this.currentQuestionIndex = 0;
        this.selectedOptionId = null;
        this.userAnswers = {};
        this.resetScores();
    }

    /** Algoritmo de Fisher-Yates para barajar el array de forma aleatoria y equitativa */
    private shuffleArray<T>(array: T[]): T[] {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
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

        const selectedOption = currentQ.options.find(o => o.id === this.selectedOptionId);
        if (selectedOption) {
            // The backend expects the letter (e.g., "A", "B", "C") instead of the internal ID
            const optionIndex = currentQ.options.indexOf(selectedOption);
            const optionLetter = selectedOption.letter || ['A', 'B', 'C', 'D', 'E'][optionIndex];
            
            this.userAnswers[currentQ.id.toString()] = optionLetter;

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
            // End of Mission 1
            this.finishTest();
        }
    }

    /** Briefly removes then re-adds the animation class for smooth transitions */
    private triggerTransition(callback: () => void) {
        this.isTransitioningQuestion = true;
        this.isAnimating = false;

        // Wait 120ms for the blur & fade-out to take effect before swapping content
        setTimeout(() => {
            callback();

            requestAnimationFrame(() => {
                this.isTransitioningQuestion = false;
                this.isAnimating = true;
                // Remove animation class after slide completes so it can be re-triggered
                setTimeout(() => { this.isAnimating = false; }, 400);
            });
        }, 120);
    }

    finishTest() {
        if (this.isFinishing) return;
        this.isFinishing = true;

        this.viewState = 'analyzing';

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            localStorage.setItem(`hasTakenTest_${user.id}`, 'true');
        }

        // Espejo local de las respuestas (soporte offline y modal de revisión)
        const userId = user?.id || 'guest';
        localStorage.setItem(`test_answers_${userId}`, JSON.stringify(this.userAnswers));
        localStorage.setItem(`test_theoretical_scores_${userId}`, JSON.stringify(this.profileScores));

        // El motor determinista (A1-A7) corre en la API y persiste el perfil
        // en el historial. El timer garantiza un splash mínimo legible.
        forkJoin({
            profile: this.profileService.computeProfileRemote(this.userAnswers),
            delay: timer(1400),
        }).subscribe({
            next: () => this.router.navigate(['/test-result']),
            error: () => {
                // Sin conexión: computamos localmente con el motor de respaldo
                // para no bloquear al estudiante, incluyendo la evidencia
                // local de calibración y simuladores (igual que la API).
                const profile = this.profileService.computeProfile(
                    this.profileScores,
                    this.readLocalArray(`calibration_results_${userId}`),
                    this.readLocalArray(`simulator_results_${userId}`),
                );
                this.profileService.cacheProfile(profile);
                this.toastService.showToast(
                    'Sin conexión con el servidor: mostramos tu perfil calculado localmente.',
                    'info'
                );
                this.router.navigate(['/test-result']);
            },
        });
    }

    /** Lee un arreglo persistido en localStorage (o [] si no existe/corrupto). */
    private readLocalArray(key: string): any[] {
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
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
