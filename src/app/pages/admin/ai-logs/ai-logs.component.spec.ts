import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';

import { AiLogsComponent } from './ai-logs.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('AiLogsComponent', () => {
  let component: AiLogsComponent;
  let fixture: ComponentFixture<AiLogsComponent>;

  beforeAll(() => {
    registerLocaleData(localeEsMx);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiLogsComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(AiLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.classList.remove('dark-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps operation rows and badges on dark theme surfaces', () => {
    document.body.classList.add('dark-theme');
    component.isLoading = false;
    component.errorMessage = '';
    component.logs = [
      {
        id: 'run-dark-mode',
        date: '2026-07-18T16:30:39.000Z',
        studentName: 'student-id',
        detectedProfile: 'Matemáticas + Ciencia',
        latency: '798ms',
        status: 'Éxito',
        provider: 'Groq',
        tokensConsumed: 120,
      },
    ];
    fixture.detectChanges();

    const operationCell = fixture.nativeElement.querySelector('tbody td');
    const roleBadge = fixture.nativeElement.querySelector('.role-badge');
    const latencyBadge = fixture.nativeElement.querySelector('.latency-badge');

    expect(getComputedStyle(operationCell).backgroundColor).toBe('rgb(11, 17, 32)');
    expect(getComputedStyle(operationCell).color).toBe('rgb(249, 250, 251)');
    expect(getComputedStyle(roleBadge).backgroundColor).toBe('rgb(17, 24, 39)');
    expect(getComputedStyle(latencyBadge).color).toBe('rgb(253, 186, 116)');
  });
});
