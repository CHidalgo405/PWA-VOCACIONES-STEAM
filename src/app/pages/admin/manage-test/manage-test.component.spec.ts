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

  afterEach(() => {
    document.body.classList.remove('dark-theme');
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

  it('uses dark theme surfaces and readable native controls in the question modal', () => {
    document.body.classList.add('dark-theme');
    component.openModal('view', {
      id: 'question-dark-mode',
      text: '¿Qué actividad disfrutas más?',
      order: 1,
      status: 'activo',
      options: [
        { id: 'option-1', text: 'Investigar fenómenos', steamTrait: 'ciencia' },
      ],
    });
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector('.modal-sidebar');
    const optionCard = fixture.nativeElement.querySelector('.option-card');
    const optionInput = fixture.nativeElement.querySelector(
      '.option-card input[type="text"]',
    );
    const statusSetting = fixture.nativeElement.querySelector('.status-setting');

    expect(getComputedStyle(sidebar).backgroundImage).toContain('rgb(11, 17, 32)');
    expect(getComputedStyle(optionCard).borderColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(optionInput).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(getComputedStyle(optionInput).color).toBe('rgb(156, 163, 175)');
    expect(getComputedStyle(statusSetting).backgroundColor).toBe('rgb(17, 24, 39)');
  });
});
