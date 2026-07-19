import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestResultComponent } from './test-result.component';
import { provideAppTestDependencies } from '../../../testing/app-test-providers';

describe('TestResultComponent', () => {
  let component: TestResultComponent;
  let fixture: ComponentFixture<TestResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(TestResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resolves new option IDs and legacy letters without displaying a label', () => {
    component.allQuestions = [
      {
        id: 'question-1',
        text: '¿Qué actividad prefieres?',
        order: 1,
        options: [
          {
            id: 'option-1',
            text: 'Investigar',
            letter: 'A',
            steamTrait: 'ciencia',
          },
        ],
      },
    ];

    expect(component.getAnswerText('question-1', 'option-1')).toBe(
      'Investigar',
    );
    expect(component.getAnswerText('question-1', 'A')).toBe('Investigar');
  });
});
