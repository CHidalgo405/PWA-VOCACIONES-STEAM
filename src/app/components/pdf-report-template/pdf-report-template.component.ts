import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';
import { SteamArea } from '../../pages/test-result/test-result.component';
import { UniversityRecommendation } from '../../core/services/test.service';

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
                <p>Análisis de Perfil y Afinidades</p>
            </div>
            <div class="pdf-date">
                {{ currentDate | date:'dd/MM/yyyy' }}
            </div>
        </div>

        <div class="pdf-body">
            <!-- Verdict -->
            <div class="pdf-section pdf-verdict-section">
                <h2>Veredicto del Perfil</h2>
                <div class="pdf-verdict-box">
                    <span class="pdf-greeting">{{ greeting }}</span>
                    <h3>¡El perfil dominante es <span class="pdf-highlight">{{ dominantTraits }}</span>!</h3>
                    <p>Hemos analizado los resultados para descubrir las áreas donde el potencial brilla más.</p>
                </div>
            </div>

            <!-- STEAM Breakdown -->
            <div class="pdf-section">
                <h2>Desglose de Áreas STEAM</h2>
                <div class="pdf-steam-bars">
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
            </div>

            <!-- AI Insights -->
            <div class="pdf-section">
                <h2>Análisis del ADN STEAM (Generado por IA)</h2>
                <div class="pdf-ai-box">
                    <p>{{ description }}</p>
                </div>
            </div>

            <!-- Top Careers -->
            <div class="pdf-section" *ngIf="recommendations && recommendations.length > 0">
                <h2>Principales Carreras Sugeridas</h2>
                <div class="pdf-career-list">
                    <div class="pdf-career-item" *ngFor="let uni of recommendations | slice:0:3">
                        <div class="pdf-career-icon">
                            <app-lucide-icon name="graduation-cap" [size]="20" color="#07B1C9"></app-lucide-icon>
                        </div>
                        <div class="pdf-career-info">
                            <h4>{{ uni.suggestedMajor }}</h4>
                            <p class="uni-name">{{ uni.name }} - {{ uni.location }}</p>
                            <p class="uni-match">{{ uni.matchReason | slice:0:120 }}...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pdf-footer">
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
        padding: 40px 50px;
        display: flex;
        flex-direction: column;
        gap: 35px;
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

    .pdf-verdict-box {
        background: #f8fafc;
        border-left: 4px solid #07B1C9;
        padding: 20px 25px;
        border-radius: 0 12px 12px 0;
        .pdf-greeting { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        h3 { margin: 8px 0; font-size: 24px; color: #0f172a; .pdf-highlight { color: #07B1C9; } }
        p { margin: 0; font-size: 14px; color: #475569; line-height: 1.6; }
    }

    .pdf-steam-bars { display: flex; flex-direction: column; gap: 16px; }
    .pdf-bar-row { display: flex; align-items: center; gap: 15px; }
    .pdf-bar-label { width: 130px; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #1e293b; }
    .pdf-bar-track { flex: 1; height: 12px; background: #f1f5f9; border-radius: 20px; overflow: hidden; .pdf-bar-fill { height: 100%; border-radius: 20px; } }
    .pdf-bar-pct { width: 45px; text-align: right; font-size: 14px; font-weight: 800; }

    .pdf-ai-box { p { font-size: 14px; line-height: 1.8; color: #334155; margin: 0; text-align: justify; } }

    .pdf-career-list { display: flex; flex-direction: column; gap: 16px; }
    .pdf-career-item {
        display: flex; align-items: flex-start; gap: 15px; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        .pdf-career-icon { width: 40px; height: 40px; background: rgba(7,177,201,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pdf-career-info { flex: 1; h4 { margin: 0 0 4px; font-size: 15px; font-weight: 800; color: #0f172a; } .uni-name { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #64748b; } .uni-match { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; } }
    }

    .pdf-footer { margin-top: 20px; padding: 20px 50px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; p { margin: 0; font-size: 12px; color: #94a3b8; strong { color: #64748b; } } }
  `]
})
export class PdfReportTemplateComponent {
  @Input() dominantTraits: string = '';
  @Input() description: string = '';
  @Input() greeting: string = '';
  @Input() steamAreas: SteamArea[] = [];
  @Input() recommendations: UniversityRecommendation[] = [];
  @Input() currentDate: Date = new Date();
}
