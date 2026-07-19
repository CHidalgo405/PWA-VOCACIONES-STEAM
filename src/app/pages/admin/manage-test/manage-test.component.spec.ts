import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTestComponent } from './manage-test.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('ManageTestComponent', () => {
  let component: ManageTestComponent;
  let fixture: ComponentFixture<ManageTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageTestComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reports useful readiness without relying on public letters', () => {
    const question = {
      id: 'question-1',
      text: '¿Qué actividad prefieres?',
      order: 1,
      status: 'activo',
      options: [
        { id: 'option-1', text: 'Investigar', steamTrait: 'ciencia' },
        { id: 'option-2', text: 'Construir', steamTrait: 'ingenieria' },
      ],
    };

    expect(component.getOptionCount(question)).toBe(2);
    expect(component.isQuestionReady(question)).toBeTrue();
  });
});
