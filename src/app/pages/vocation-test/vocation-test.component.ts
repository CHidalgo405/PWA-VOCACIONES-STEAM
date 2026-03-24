import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { VocationTestService, Question, Option, TestSubmissionResponse } from '../../core/services/test.service';
import { AuthService } from '../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-vocation-test',
    standalone: true,
    imports: [CommonModule, SplashScreenComponent],
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

  userAnswers: Record<string, string> = {};

  constructor(private router: Router, private testService: VocationTestService, private authService: AuthService) { }

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

    get currentQuestion(): Question {
        return this.questions[this.currentQuestionIndex];
    }

    get progressPercentage(): number {
        return ((this.currentQuestionIndex) / this.questions.length) * 100;
    }

    selectOption(optionId: string) {
        this.selectedOptionId = optionId;
        this.showAlert = false; // Hide alert if it was showing
    }

    nextQuestion() {
        if (!this.selectedOptionId) {
            this.showAlert = true;
            setTimeout(() => this.showAlert = false, 3000);
            return;
        }

    // Accumulate score and store answer
    const currentQ = this.currentQuestion;
    this.userAnswers[currentQ.id.toString()] = this.selectedOptionId;

    const selectedOption = currentQ.options.find(o => o.id === this.selectedOptionId);
        if (selectedOption) {
            const tagKey = selectedOption.steamTrait.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (this.profileScores[tagKey] !== undefined) {
                this.profileScores[tagKey]++;
            }
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.selectedOptionId = null;
        } else {
            this.finishTest();
        }
    }

  finishTest() {
    this.viewState = 'analyzing';

    const mockResult: TestSubmissionResponse = {
      testId: 'mock-' + new Date().getTime(),
      scores: this.profileScores,
      dominantTraits: 'Tecnología + Ciencia (Simulado)',
      aiProfileDescription: 'Eres una persona curiosa con una gran afinidad por la tecnología y la innovación. Tienes perfil analítico, ideal para ingeniería o ciencias de la computación.',
      recommendations: [
        {
          id: 1,
          name: 'Universidad Tecnológica (UTCV)',
          location: 'Veracruz, 5km',
          suggestedMajor: 'Ingeniería de Software',
          matchReason: 'Combina perfectamente con tu perfil tecnológico y analítico.',
          keyDates: 'Examen de Admisión: Junio 2026',
          studyPlan: ['Programación Avanzada', 'Redes', 'Bases de Datos'],
          websiteUrl: 'https://www.utcv.edu.mx'
        },
        {
          id: 2,
          name: 'Instituto Politécnico Nacional (IPN)',
          location: 'Ciudad de México',
          suggestedMajor: 'Ing. Mecatrónica',
          matchReason: 'Ideal para tus habilidades lógicas y tu interés en proyectos físicos.',
          keyDates: 'Convocatoria: Febrero 2026',
          studyPlan: ['Robótica', 'Sistemas Digitales', 'Física'],
          websiteUrl: 'https://www.ipn.mx'
        }
      ]
    };

    // Llamada API a TestService (esperando datos IA)
    this.testService.submitTest(this.userAnswers).pipe(
      catchError(err => {
        console.warn("API falló o no disponible, usando resultado simulado...", err);
        return of(mockResult);
      })
    ).subscribe(res => {
      if (res) {
        // En un caso real podrías guardar 'res' en un store, 
        // localStorage Temporal o servicio compartido antes de ir a test-result
        
        // Mock save test completion state
        const user = this.authService.getCurrentUser();
        if (user?.id) {
          localStorage.setItem(`hasTakenTest_${user.id}`, 'true');
        }

        localStorage.setItem('latest_test_result', JSON.stringify(res));
        
        // Simular tiempo de análisis para la animación
        setTimeout(() => {
          this.router.navigate(['/test-result']);
        }, 3000);
      }
    });
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
