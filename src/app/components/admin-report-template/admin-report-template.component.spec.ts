import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminReportTemplateComponent } from './admin-report-template.component';

describe('AdminReportTemplateComponent', () => {
  let fixture: ComponentFixture<AdminReportTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReportTemplateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReportTemplateComponent);
    fixture.componentInstance.recentUsers = [
      {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        profile: 'Tecnología',
        date: '19/07/2026',
        status: 'Completado',
      },
    ];
    fixture.detectChanges();
  });

  it('describe el motor determinista y limita la IA al refinamiento A8', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Motor vocacional');
    expect(text).toContain('Cálculo determinista y explicable para el perfil A1–A7');
    expect(text).toContain('IA para universidades');
    expect(text).toContain('Uso acotado al refinamiento A8');
    expect(text).not.toContain('Motor de IA');
  });

  it('no inventa métricas de infraestructura ni una institución por usuario', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Capacidad al 85%');
    expect(text).not.toContain('Latencia promedio');
    expect(text).not.toContain('Institución');
    expect(text).toContain('Consulta la Torre de Control');
  });
});
