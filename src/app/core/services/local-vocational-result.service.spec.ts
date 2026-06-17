import { TestBed } from '@angular/core/testing';
import { LocalVocationalResultService } from './local-vocational-result.service';
import type { Question } from './test.service';

describe('LocalVocationalResultService', () => {
  let service: LocalVocationalResultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalVocationalResultService);
  });

  it('builds an experimental local result from current test answers', () => {
    const result = service.buildResult({
      questions: apiQuestionsFixture,
      answers: {
        q1: 'B',
        q2: 'A'
      },
      hasCompletedCalibrations: false,
      completedSimulatorCount: 0,
      dataSource: 'local'
    });

    expect(result).toBeTruthy();
    expect(result?.isExperimental).toBeTrue();
    expect(result?.strengthProfile.areaScores.tecnologia).toBeGreaterThan(0);
    expect(result?.strengthProfile.rankedSkills.length).toBeGreaterThan(0);
    expect(result?.careerRecommendations.recommendations.length).toBe(5);
    expect(result?.strengthProfile.confidence).toBeTruthy();
  });

  it('returns null when there are no usable local inputs', () => {
    const result = service.buildResult({
      questions: [],
      answers: {},
      dataSource: 'local'
    });

    expect(result).toBeNull();
  });
});

const apiQuestionsFixture: Question[] = [
  {
    id: 'q1',
    order: 1,
    text: 'Que actividad prefieres?',
    options: [
      { id: 'q1-a', letter: 'A', text: 'Investigar evidencia', steamTrait: 'Ciencia' },
      { id: 'q1-b', letter: 'B', text: 'Programar una solucion', steamTrait: 'Tecnología' },
      { id: 'q1-c', letter: 'C', text: 'Disenar algo visual', steamTrait: 'Artes' }
    ]
  },
  {
    id: 'q2',
    order: 2,
    text: 'Como resuelves un problema?',
    options: [
      { id: 'q2-a', letter: 'A', text: 'Con logica y estructura', steamTrait: 'Matemáticas' },
      { id: 'q2-b', letter: 'B', text: 'Construyendo un prototipo', steamTrait: 'Ingeniería' },
      { id: 'q2-c', letter: 'C', text: 'No estoy seguro', steamTrait: 'Artes' }
    ]
  }
];
