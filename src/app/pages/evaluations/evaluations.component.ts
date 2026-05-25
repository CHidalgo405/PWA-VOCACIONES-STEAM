import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { VocationTestService, Question, Option, TestSubmissionResponse } from '../../core/services/test.service';
import { AuthService } from '../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

import { ErrorLabComponent } from './error-lab/error-lab.component';
import { HobbiesTestComponent } from './hobbies-test/hobbies-test.component';

@Component({
    selector: 'app-evaluations',
    standalone: true,
    imports: [CommonModule, FormsModule, DecimalPipe, SplashScreenComponent, LucideIconComponent, HobbiesTestComponent, ErrorLabComponent],
    templateUrl: './evaluations.component.html',
    styleUrls: ['./evaluations.component.scss']
})
export class EvaluationsComponent implements OnInit {

    // Test states: 'hub' | 'questionnaire' | 'mission2' | 'mission3' | 'location-prompt' | 'analyzing'
    viewState: 'hub' | 'questionnaire' | 'mission2' | 'mission3' | 'location-prompt' | 'analyzing' = 'hub';

    // Mission States
    mission1Completed = false;
    mission2Completed = false;
    mission3Completed = false;
    hobbiesAnswers: any = null;
    errorLabMetrics: any = null;

    // Location prompt variables
    wantsLocalUniversities: boolean | null = null;
    userLocation: string = '';

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
    isFinishing: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
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

        // Check if coming from dashboard with a specific mission to start
        this.route.queryParams.subscribe(params => {
            const startMission = params['startMission'];
            if (startMission === '2') {
                this.mission1Completed = true; // Mark mission 1 as done
                this.viewState = 'mission2';
            } else if (startMission === '3') {
                this.mission1Completed = true;
                this.mission2Completed = true; // Mark missions 1 & 2 as done
                this.viewState = 'mission3';
            }
        });
    }

    startTest() {
        this.viewState = 'questionnaire';
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.resetScores();
    }

    startMission2() {
        this.viewState = 'mission2';
    }

    startMission3() {
        this.viewState = 'mission3';
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
            this.mission1Completed = true;
            this.viewState = 'hub';
        }
    }

    onMission2Completed(answers: any) {
        this.hobbiesAnswers = answers;
        this.mission2Completed = true;
        this.viewState = 'hub';
    }

    onMission3Completed(metrics: any) {
        this.errorLabMetrics = metrics;
        this.mission3Completed = true;
        this.viewState = 'location-prompt';
        
        // Assemble final payload locally
        const user = this.authService.getCurrentUser();
        const userId = user?.id || 'guest';
        const finalPayload = {
            m1Answers: this.userAnswers,
            m2Hobbies: this.hobbiesAnswers,
            m3Metrics: this.errorLabMetrics
        };
        localStorage.setItem(`test_answers_extended_${userId}`, JSON.stringify(finalPayload));
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
        if (this.isFinishing) return;
        this.isFinishing = true;

        this.viewState = 'analyzing';

        const user = this.authService.getCurrentUser();
        if (user?.id) {
            localStorage.setItem(`hasTakenTest_${user.id}`, 'true');
        }
        
        // Save answers so the results page can call the API
        const userId = user?.id || 'guest';
        localStorage.setItem(`test_answers_${userId}`, JSON.stringify(this.userAnswers));

        // Save location if user wants local universities
        if (this.wantsLocalUniversities && this.userLocation.trim()) {
            localStorage.setItem(`test_location_${userId}`, this.userLocation.trim());
        } else {
            localStorage.removeItem(`test_location_${userId}`);
        }

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
