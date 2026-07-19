import { fakeAsync, tick } from '@angular/core/testing';
import { throwError } from 'rxjs';
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
});
