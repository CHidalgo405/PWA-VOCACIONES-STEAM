import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';
import { SteamArea } from '../../pages/test-result/test-result.component';
import { UniversityRecommendation } from '../../core/services/test.service';

export interface PdfCareerRecommendation {
  name: string;
  compatibilityPercentage?: number;
  reason?: string;
  sourceLabel?: string;
  areas?: string[];
}

export interface PdfUniversityRecommendation {
  name: string;
  location?: string;
  suggestedMajor?: string;
  matchReason?: string;
  matchPercentage?: number;
  dataSourceLabel?: string;
  warnings?: string[];
}

export interface PdfProgressItem {
  title: string;
  description?: string;
  meta?: string;
  dataSourceLabel?: string;
}

export interface PdfNextStep {
  title: string;
  description: string;
}

@Component({
  selector: 'app-pdf-report-template',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  template: `
    <div id="pdf-report-template" class="pdf-container">
        <div class="pdf-header">
            <div class="pdf-logo-wrap" style="background: transparent; padding: 0;">
                <img src="logo.svg" alt="STEAM Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="pdf-title-block">
                <h1>Reporte de Orientación STEAM</h1>
                <p>Perfil vocacional para compartir</p>
            </div>
            <div class="pdf-date">
                {{ currentDate | date:'dd/MM/yyyy' }}
            </div>
        </div>

        <div class="pdf-body">
            <div class="pdf-owner-row">
                <div>
                    <span class="pdf-label">Estudiante</span>
                    <strong>{{ userName || 'Usuario STEAM' }}</strong>
                </div>
                <div>
                    <span class="pdf-label">Fecha</span>
                    <strong>{{ currentDate | date:'d MMM y' }}</strong>
                </div>
                <div>
                    <span class="pdf-label">Confianza</span>
                    <strong>{{ confidenceLabel || 'Confianza media' }}</strong>
                </div>
            </div>

            <div class="pdf-section pdf-verdict-section">
                <h2>Resumen del perfil</h2>
                <div class="pdf-verdict-box">
                    <span class="pdf-greeting">{{ greeting || 'Hola' }}</span>
                    <h3>Perfil dominante: <span class="pdf-highlight">{{ dominantTraits || 'Perfil STEAM en exploración' }}</span></h3>
                    <div class="pdf-summary-grid">
                        <div>
                            <span>Área secundaria</span>
                            <strong>{{ secondaryArea || 'Datos insuficientes' }}</strong>
                        </div>
                        <div>
                            <span>Nivel de confianza</span>
                            <strong>{{ confidenceLabel || 'Confianza media' }}</strong>
                        </div>
                    </div>
                    <p>{{ confidenceExplanation || 'La confianza puede mejorar al completar calibraciones y simuladores.' }}</p>
                </div>
            </div>

            <div class="pdf-section">
                <h2>ADN STEAM</h2>
                <p class="pdf-section-note">Esta gráfica resume la intensidad de cada área. Sirve como guía para explorar, no como límite.</p>
                <div class="pdf-steam-bars" *ngIf="steamAreas && steamAreas.length > 0; else noSteamData">
                    <div class="pdf-bar-row" *ngFor="let area of steamAreas">
                        <div class="pdf-bar-label">
                            <app-lucide-icon [name]="area.icon" [size]="16" [color]="area.gradientStart"></app-lucide-icon>
                            <span>{{ area.label }}</span>
                        </div>
                        <div class="pdf-bar-track">
                            <div class="pdf-bar-fill" [style.width]="area.percentage + '%'" [style.background]="area.gradientStart"></div>
                        </div>
                        <div class="pdf-bar-pct" [style.color]="area.gradientStart">{{ area.percentage }}%</div>
                    </div>
                </div>
                <ng-template #noSteamData>
                    <div class="pdf-empty">No hay puntajes STEAM suficientes para graficar este perfil.</div>
                </ng-template>
            </div>

            <div class="pdf-section">
                <h2>Explicación del resultado</h2>
                <div class="pdf-ai-box">
                    <p>{{ description || 'Aún falta información para explicar el perfil con suficiente detalle.' }}</p>
                    <p *ngIf="dataSourceNote" class="pdf-source-note">{{ dataSourceNote }}</p>
                </div>
            </div>

            <div class="pdf-section">
                <h2>Top carreras recomendadas</h2>
                <div class="pdf-career-list">
                    <div class="pdf-career-item" *ngFor="let career of topCareerRecommendations">
                        <div class="pdf-career-icon">
                            <app-lucide-icon name="graduation-cap" [size]="20" color="#07B1C9"></app-lucide-icon>
                        </div>
                        <div class="pdf-career-info">
                            <div class="pdf-line-title">
                                <h4>{{ career.name }}</h4>
                                <span *ngIf="career.compatibilityPercentage !== undefined">{{ career.compatibilityPercentage }}%</span>
                            </div>
                            <p class="uni-name">{{ career.sourceLabel || 'Resultado vocacional' }}</p>
                            <p class="uni-match">{{ career.reason || 'Coincide con señales del perfil actual.' }}</p>
                        </div>
                    </div>
                </div>
                <div class="pdf-empty" *ngIf="topCareerRecommendations.length === 0">No hay carreras suficientes para mostrar todavía.</div>
            </div>

            <div class="pdf-section">
                <h2>Universidades recomendadas</h2>
                <div class="pdf-career-list" *ngIf="topUniversityRecommendations.length > 0; else noUniversities">
                    <div class="pdf-career-item" *ngFor="let university of topUniversityRecommendations">
                        <div class="pdf-career-icon">
                            <app-lucide-icon name="map-pin" [size]="20" color="#6366F1"></app-lucide-icon>
                        </div>
                        <div class="pdf-career-info">
                            <div class="pdf-line-title">
                                <h4>{{ university.name }}</h4>
                                <span *ngIf="university.matchPercentage !== undefined">{{ university.matchPercentage }}%</span>
                            </div>
                            <p class="uni-name">{{ university.location || 'Ubicación no especificada' }} · {{ university.dataSourceLabel || 'API/local' }}</p>
                            <p class="uni-match">
                                {{ university.suggestedMajor ? 'Carrera sugerida: ' + university.suggestedMajor + '. ' : '' }}
                                {{ university.matchReason || 'Falta validar oferta académica real.' }}
                            </p>
                            <p class="pdf-warning" *ngIf="university.warnings && university.warnings.length">{{ university.warnings[0] }}</p>
                        </div>
                    </div>
                </div>
                <ng-template #noUniversities>
                    <div class="pdf-empty">No hay universidades recomendadas en este resultado. Explora el mapa para generar opciones cercanas.</div>
                </ng-template>
            </div>

            <div class="pdf-section pdf-two-column">
                <div>
                    <h2>Calibraciones completadas</h2>
                    <div class="pdf-mini-list" *ngIf="calibrationSummaries.length > 0; else noCalibrations">
                        <div class="pdf-mini-item" *ngFor="let item of calibrationSummaries">
                            <strong>{{ item.title }}</strong>
                            <span>{{ item.description || item.meta || 'Completada' }}</span>
                        </div>
                    </div>
                    <ng-template #noCalibrations>
                        <div class="pdf-empty">Aún no hay calibraciones completadas.</div>
                    </ng-template>
                </div>
                <div>
                    <h2>Simuladores completados</h2>
                    <div class="pdf-mini-list" *ngIf="simulatorSummaries.length > 0; else noSimulators">
                        <div class="pdf-mini-item" *ngFor="let item of simulatorSummaries">
                            <strong>{{ item.title }}</strong>
                            <span>{{ item.description || item.meta || 'Completado' }}</span>
                        </div>
                    </div>
                    <ng-template #noSimulators>
                        <div class="pdf-empty">Aún no hay simuladores completados.</div>
                    </ng-template>
                </div>
            </div>

            <div class="pdf-section">
                <h2>Próximos pasos sugeridos</h2>
                <div class="pdf-next-steps">
                    <div class="pdf-next-step" *ngFor="let step of nextSteps">
                        <strong>{{ step.title }}</strong>
                        <span>{{ step.description }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="pdf-footer">
            <p><strong>Nota responsable:</strong> este reporte orienta la exploración vocacional. No es una decisión definitiva ni reemplaza a un orientador, padre, tutor o docente.</p>
            <p>Generado confidencialmente por <strong>Vocaciones STEAM App</strong></p>
        </div>
    </div>
  `,
  styles: [`
    .pdf-container {
        display: block;
        width: 800px;
        background-color: #ffffff;
        color: #1e293b;
        font-family: 'Poppins', sans-serif;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }

    .pdf-header {
        background: linear-gradient(135deg, #07B1C9, #058598);
        color: white;
        padding: 40px 50px;
        display: flex;
        align-items: center;
        gap: 20px;
        border-bottom: 5px solid #046574;

        .pdf-logo-wrap {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pdf-title-block {
            flex: 1;
            h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
            p { margin: 4px 0 0; font-size: 14px; font-weight: 500; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
        }

        .pdf-date {
            font-size: 14px;
            font-weight: 600;
            opacity: 0.8;
            background: rgba(0,0,0,0.15);
            padding: 6px 12px;
            border-radius: 8px;
        }
    }

    .pdf-body {
        padding: 34px 50px 40px;
        display: flex;
        flex-direction: column;
        gap: 28px;
    }

    .pdf-owner-row {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px 16px;
    }

    .pdf-owner-row > div {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .pdf-label,
    .pdf-owner-row span {
        font-size: 10px;
        font-weight: 800;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .pdf-owner-row strong {
        font-size: 14px;
        color: #0f172a;
    }

    .pdf-section {
        h2 {
            font-size: 18px;
            font-weight: 800;
            color: #07B1C9;
            margin: 0 0 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #f1f5f9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    }

    .pdf-section-note {
        margin: -6px 0 16px;
        font-size: 13px;
        color: #475569;
        line-height: 1.55;
    }

    .pdf-verdict-box {
        background: #f8fafc;
        border: 1px solid #dbeafe;
        padding: 20px 25px;
        border-radius: 14px;
        .pdf-greeting { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        h3 { margin: 8px 0; font-size: 24px; color: #0f172a; .pdf-highlight { color: #07B1C9; } }
        p { margin: 0; font-size: 14px; color: #475569; line-height: 1.6; }
    }

    .pdf-summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 14px 0;
    }

    .pdf-summary-grid div {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .pdf-summary-grid span {
        font-size: 11px;
        color: #64748b;
        font-weight: 700;
    }

    .pdf-summary-grid strong {
        font-size: 14px;
        color: #0f172a;
    }

    .pdf-steam-bars { display: flex; flex-direction: column; gap: 16px; }
    .pdf-bar-row { display: flex; align-items: center; gap: 15px; }
    .pdf-bar-label { width: 130px; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #1e293b; }
    .pdf-bar-track { flex: 1; height: 12px; background: #f1f5f9; border-radius: 20px; overflow: hidden; .pdf-bar-fill { height: 100%; border-radius: 20px; } }
    .pdf-bar-pct { width: 45px; text-align: right; font-size: 14px; font-weight: 800; }

    .pdf-ai-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 16px 18px;
        p { font-size: 14px; line-height: 1.75; color: #334155; margin: 0 0 10px; text-align: left; }
        p:last-child { margin-bottom: 0; }
    }

    .pdf-source-note {
        color: #64748b;
        font-size: 12px !important;
    }

    .pdf-career-list { display: flex; flex-direction: column; gap: 16px; }
    .pdf-career-item {
        display: flex; align-items: flex-start; gap: 15px; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        .pdf-career-icon { width: 40px; height: 40px; background: rgba(7,177,201,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pdf-career-info { flex: 1; h4 { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #0f172a; } .uni-name { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #64748b; } .uni-match { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; } }
    }

    .pdf-line-title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    }

    .pdf-line-title span {
        color: #07B1C9;
        font-size: 13px;
        font-weight: 900;
        white-space: nowrap;
    }

    .pdf-warning {
        margin: 8px 0 0;
        color: #92400e;
        font-size: 12px;
        line-height: 1.45;
    }

    .pdf-two-column {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
    }

    .pdf-mini-list,
    .pdf-next-steps {
        display: grid;
        gap: 10px;
    }

    .pdf-mini-item,
    .pdf-next-step,
    .pdf-empty {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        color: #475569;
        font-size: 12px;
        line-height: 1.5;
    }

    .pdf-mini-item,
    .pdf-next-step {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .pdf-mini-item strong,
    .pdf-next-step strong {
        color: #0f172a;
        font-size: 13px;
    }

    .pdf-footer {
        margin-top: 8px;
        padding: 20px 50px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        display: grid;
        gap: 8px;
        p { margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; strong { color: #334155; } }
    }
  `]
})
export class PdfReportTemplateComponent {
  @Input() userName: string = '';
  @Input() dominantTraits: string = '';
  @Input() secondaryArea: string = '';
  @Input() confidenceLabel: string = '';
  @Input() confidenceExplanation: string = '';
  @Input() description: string = '';
  @Input() greeting: string = '';
  @Input() steamAreas: SteamArea[] = [];
  @Input() careerRecommendations: PdfCareerRecommendation[] = [];
  @Input() universityRecommendations: PdfUniversityRecommendation[] = [];
  @Input() simulatorSummaries: PdfProgressItem[] = [];
  @Input() calibrationSummaries: PdfProgressItem[] = [];
  @Input() nextSteps: PdfNextStep[] = [];
  @Input() dataSourceNote: string = '';
  @Input() recommendations: UniversityRecommendation[] = [];
  @Input() currentDate: Date = new Date();

  get topCareerRecommendations(): PdfCareerRecommendation[] {
    if (this.careerRecommendations.length > 0) {
      return this.careerRecommendations.slice(0, 5);
    }
    return this.recommendations.slice(0, 5).map((recommendation, index) => ({
      name: recommendation.suggestedMajor,
      compatibilityPercentage: Math.max(70, 95 - index * 4),
      reason: recommendation.matchReason,
      sourceLabel: recommendation.name || 'API'
    }));
  }

  get topUniversityRecommendations(): PdfUniversityRecommendation[] {
    if (this.universityRecommendations.length > 0) {
      return this.universityRecommendations.slice(0, 5);
    }
    return this.recommendations.slice(0, 5).map((recommendation) => ({
      name: recommendation.name,
      location: recommendation.location,
      suggestedMajor: recommendation.suggestedMajor,
      matchReason: recommendation.matchReason,
      dataSourceLabel: 'API'
    }));
  }
}
