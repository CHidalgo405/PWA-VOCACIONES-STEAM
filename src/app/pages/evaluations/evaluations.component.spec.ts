import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EvaluationsComponent } from './evaluations.component';

describe('EvaluationsComponent question loading', () => {
  it('keeps the test blocked and exposes retry when questions fail', fakeAsync(() => {
    const component = new EvaluationsComponent(
      { navigate: jasmine.createSpy() } as any,
      {
        getQuestions: () => throwError(() => new Error('offline')),
      } as any,
      { getCurrentUser: () => ({ id: 'user-1' }) } as any,
      {} as any,
      {} as any,
    );

    component.ngOnInit();
    tick(600);
    component.startTest();

    expect(component.loadingError).toContain('No pudimos cargar');
    expect(component.questions).toEqual([]);
    expect(component.viewState).toBe('onboarding');
  }));

  it('stores the stable option ID instead of its legacy letter', () => {
    const component = new EvaluationsComponent(
      { navigate: jasmine.createSpy() } as any,
      { getQuestions: () => of([]) } as any,
      { getCurrentUser: () => ({ id: 'user-1' }) } as any,
      {} as any,
      {} as any,
    );
    component.questions = [
      {
        id: 'question-1',
        text: '¿Qué prefieres?',
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
    component.selectedOptionId = 'option-1';
    spyOn(component, 'finishTest');

    component.nextQuestion();

    expect(component.userAnswers).toEqual({ 'question-1': 'option-1' });
    expect(component.finishTest).toHaveBeenCalled();
  });
});
