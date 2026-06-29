import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamArea } from '../../pages/test-result/test-result.component';
import {
  CareerRecommendation,
  VocationRecommendation,
  ProfileStrength,
  CalibrationState,
} from '../../core/models/vocational-profile.models';
import { UniversityRecommendation } from '../../core/services/test.service';

@Component({
  selector: 'app-pdf-report-template',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="pdf-root">

  <!-- ════════════════════════════ PORTADA ════════════════════════════ -->
  <header class="pdf-cover">
    <div class="cover-rainbow-bar"></div>
    <div class="cover-watermark">STEAM</div>
    <div class="cover-inner">
      <div class="cover-logo-col">
        <img src="logo.svg" alt="STEAM" class="cover-logo">
        <span class="cover-app-label">Vocaciones STEAM</span>
      </div>
      <div class="cover-title-col">
        <p class="cover-eyebrow">Reporte de Orientación Vocacional</p>
        <h1 class="cover-name">{{ dominantTraits }}</h1>
        <p class="cover-archetype">{{ archetype }}</p>
      </div>
      <div class="cover-meta">
        <div class="meta-pill">{{ currentDate | date:'dd MMM yyyy' }}</div>
        <div class="meta-pill calib-pill" *ngIf="calibration">
          Calibración {{ calibration.level }}%
        </div>
      </div>
    </div>
  </header>

  <!-- ════════════════════════════ PERFIL ════════════════════════════ -->
  <section class="pdf-section">
    <div class="section-head">
      <span class="section-dot" style="background:#07B1C9"></span>
      <h2 class="section-title">Perfil Vocacional</h2>
    </div>
    <div class="profile-card">
      <p class="profile-text">{{ description }}</p>
    </div>
  </section>

  <!-- ════════════════════════════ STEAM BARS ════════════════════════════ -->
  <section class="pdf-section">
    <div class="section-head">
      <span class="section-dot" style="background:#F88718"></span>
      <h2 class="section-title">Desglose de Áreas STEAM</h2>
    </div>
    <div class="steam-grid">
      <div class="steam-row" *ngFor="let area of steamAreas">
        <div class="steam-label-col">
          <span class="steam-dot" [style.background]="area.gradientStart"></span>
          <span class="steam-label">{{ area.label }}</span>
        </div>
        <div class="steam-track">
          <div class="steam-fill"
               [style.width]="area.percentage + '%'"
               [style.background]="'linear-gradient(90deg,' + area.gradientStart + ',' + area.gradientEnd + ')'">
          </div>
        </div>
        <span class="steam-pct" [style.color]="area.gradientStart">{{ area.percentage }}%</span>
      </div>
    </div>
  </section>

  <!-- ════════════════════════════ FORTALEZAS ════════════════════════════ -->
  <section class="pdf-section" *ngIf="strengths && strengths.length > 0">
    <div class="section-head">
      <span class="section-dot" style="background:#4DB046"></span>
      <h2 class="section-title">Fortalezas Detectadas</h2>
    </div>
    <div class="strengths-grid">
      <div class="strength-card" *ngFor="let s of strengths | slice:0:4">
        <p class="strength-title">{{ s.title }}</p>
        <p class="strength-desc">{{ s.description }}</p>
      </div>
    </div>
  </section>

  <!-- ════════════════════════════ VOCACIONES ════════════════════════════ -->
  <section class="pdf-section" *ngIf="vocations && vocations.length > 0">
    <div class="section-head">
      <span class="section-dot" style="background:#6366F1"></span>
      <h2 class="section-title">Vocaciones Predominantes</h2>
    </div>
    <div class="vocation-row" *ngFor="let v of vocations | slice:0:3">
      <div class="vocation-header">
        <span class="vocation-name">{{ v.name }}</span>
        <span class="affinity-badge">{{ v.affinity }}% afinidad</span>
      </div>
      <p class="vocation-desc">{{ v.description }}</p>
      <div class="skills-row">
        <span class="skill-chip" *ngFor="let sk of v.skills | slice:0:3">{{ sk }}</span>
      </div>
    </div>
  </section>

  <!-- ════════════════════════════ CARRERAS ════════════════════════════ -->
  <section class="pdf-section" *ngIf="careers && careers.length > 0">
    <div class="section-head">
      <span class="section-dot" style="background:#07B1C9"></span>
      <h2 class="section-title">Carreras Recomendadas</h2>
    </div>
    <div class="career-card" *ngFor="let c of careers | slice:0:3">
      <div class="career-header">
        <div class="career-info">
          <span class="career-name">{{ c.careerName }}</span>
          <span class="career-axis">{{ c.axis | titlecase }}</span>
        </div>
        <div class="career-ring" [style.border-color]="getAxisColor(c.axis)">
          <span class="ring-val" [style.color]="getAxisColor(c.axis)">{{ c.affinity }}%</span>
          <span class="ring-lbl">afinidad</span>
        </div>
      </div>
      <p class="career-rationale">{{ c.rationale | slice:0:180 }}{{ c.rationale.length > 180 ? '…' : '' }}</p>
      <div class="career-chips-block">
        <div class="chips-row" *ngIf="c.careerFields?.length">
          <span class="chips-label">Áreas:</span>
          <span class="chip" *ngFor="let f of c.careerFields | slice:0:3">{{ f }}</span>
        </div>
        <div class="chips-row" *ngIf="c.studyPlanHighlights?.length">
          <span class="chips-label">Estudios:</span>
          <span class="chip alt" *ngFor="let h of c.studyPlanHighlights | slice:0:3">{{ h }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Compat: university recommendations (admin) -->
  <section class="pdf-section" *ngIf="(!careers || careers.length === 0) && recommendations && recommendations.length > 0">
    <div class="section-head">
      <span class="section-dot" style="background:#07B1C9"></span>
      <h2 class="section-title">Carreras Sugeridas</h2>
    </div>
    <div class="career-card" *ngFor="let u of recommendations | slice:0:3">
      <div class="career-header">
        <div class="career-info">
          <span class="career-name">{{ u.suggestedMajor }}</span>
          <span class="career-axis">{{ u.name }} — {{ u.location }}</span>
        </div>
      </div>
      <p class="career-rationale">{{ u.matchReason | slice:0:150 }}…</p>
    </div>
  </section>

  <!-- ════════════════════════════ CALIBRACIÓN ════════════════════════════ -->
  <section class="pdf-section" *ngIf="calibration">
    <div class="section-head">
      <span class="section-dot" style="background:#4DB046"></span>
      <h2 class="section-title">Nivel de Calibración del Perfil</h2>
    </div>
    <div class="calib-card">
      <div class="calib-meter">
        <div class="calib-track">
          <div class="calib-fill" [style.width]="calibration.level + '%'"></div>
        </div>
        <span class="calib-pct">{{ calibration.level }}%</span>
      </div>
      <p class="calib-explanation">{{ calibration.explanation }}</p>
      <div class="calib-stats">
        <div class="calib-stat">
          <span class="stat-num">{{ calibration.calibrationModulesCompleted }}</span>
          <span class="stat-lbl">Módulos completados</span>
        </div>
        <div class="calib-stat">
          <span class="stat-num">{{ calibration.simulatorsCompleted }}</span>
          <span class="stat-lbl">Simuladores completados</span>
        </div>
        <div class="calib-stat">
          <span class="stat-num" style="color:#07B1C9">{{ calibration.confidence | uppercase }}</span>
          <span class="stat-lbl">Nivel de confianza</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ════════════════════════════ FOOTER ════════════════════════════ -->
  <footer class="pdf-footer">
    <div class="footer-brand">
      <img src="logo.svg" alt="Logo" class="footer-logo">
      <span>Vocaciones STEAM</span>
    </div>
    <p class="footer-note">Generado confidencialmente · Reporte personal e intransferible</p>
    <p class="footer-date">{{ currentDate | date:'MMMM yyyy' }}</p>
  </footer>

</div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .pdf-root {
      display: block;
      width: 800px;
      background: #ffffff;
      color: #1e293b;
      font-family: 'Poppins', 'Segoe UI', sans-serif;
    }

    /* ── Cover ── */
    .pdf-cover {
      position: relative;
      background: #0f172a;
      overflow: hidden;
      color: #fff;
      padding-bottom: 36px;
    }

    .cover-rainbow-bar {
      height: 6px;
      background: linear-gradient(90deg, #07B1C9 0%, #6366F1 25%, #F88718 50%, #EC4899 75%, #4DB046 100%);
    }

    .cover-watermark {
      position: absolute;
      right: -16px;
      top: -8px;
      font-size: 130px;
      font-weight: 900;
      color: rgba(255,255,255,0.04);
      letter-spacing: -4px;
      line-height: 1;
      user-select: none;
      pointer-events: none;
    }

    .cover-inner {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 24px;
      padding: 36px 50px 0;
    }

    .cover-logo-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .cover-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }

    .cover-app-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: rgba(255,255,255,0.4);
      white-space: nowrap;
    }

    .cover-title-col { flex: 1; }

    .cover-eyebrow {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #07B1C9;
      margin-bottom: 10px;
    }

    .cover-name {
      font-size: 30px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.5px;
      color: #fff;
      margin-bottom: 8px;
    }

    .cover-archetype {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255,255,255,0.55);
    }

    .cover-meta {
      display: flex;
      flex-direction: column;
      gap: 7px;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .meta-pill {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 5px 13px;
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      white-space: nowrap;
    }

    .calib-pill {
      background: rgba(7,177,201,0.18);
      border-color: rgba(7,177,201,0.4);
      color: #07B1C9;
    }

    /* ── Sections ── */
    .pdf-section {
      padding: 28px 50px;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .section-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
    }

    /* ── Profile ── */
    .profile-card {
      background: #f8fafc;
      border-left: 4px solid #07B1C9;
      border-radius: 0 12px 12px 0;
      padding: 18px 22px;
    }

    .profile-text {
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
      text-align: justify;
    }

    /* ── STEAM ── */
    .steam-grid { display: flex; flex-direction: column; gap: 13px; }

    .steam-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .steam-label-col {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 128px;
      flex-shrink: 0;
    }

    .steam-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .steam-label {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }

    .steam-track {
      flex: 1;
      height: 13px;
      background: #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
    }

    .steam-fill {
      height: 100%;
      border-radius: 20px;
    }

    .steam-pct {
      width: 42px;
      text-align: right;
      font-size: 13px;
      font-weight: 800;
      flex-shrink: 0;
    }

    /* ── Strengths ── */
    .strengths-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .strength-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 13px 15px;
    }

    .strength-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .strength-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    /* ── Vocations ── */
    .vocation-row {
      padding: 13px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .vocation-row:last-child { border-bottom: none; }

    .vocation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .vocation-name { font-size: 15px; font-weight: 800; color: #0f172a; }

    .affinity-badge {
      background: rgba(7,177,201,0.1);
      color: #07B1C9;
      border: 1px solid rgba(7,177,201,0.3);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
    }

    .vocation-desc {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .skills-row { display: flex; flex-wrap: wrap; gap: 5px; }

    .skill-chip {
      background: #f1f5f9;
      color: #475569;
      border-radius: 20px;
      padding: 3px 9px;
      font-size: 11px;
      font-weight: 600;
    }

    /* ── Careers ── */
    .career-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 17px 19px;
      margin-bottom: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .career-card:last-child { margin-bottom: 0; }

    .career-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .career-info { display: flex; flex-direction: column; gap: 3px; }

    .career-name { font-size: 16px; font-weight: 800; color: #0f172a; }

    .career-axis {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .career-ring {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 3px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ring-val { font-size: 14px; font-weight: 900; line-height: 1; }

    .ring-lbl {
      font-size: 8px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .career-rationale {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 11px;
    }

    .career-chips-block { display: flex; flex-direction: column; gap: 6px; }

    .chips-row { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }

    .chips-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .chip {
      background: #f1f5f9;
      color: #334155;
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 600;
    }

    .chip.alt {
      background: rgba(99,102,241,0.08);
      color: #6366F1;
    }

    /* ── Calibration ── */
    .calib-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 22px;
    }

    .calib-meter {
      display: flex;
      align-items: center;
      gap: 13px;
      margin-bottom: 10px;
    }

    .calib-track {
      flex: 1;
      height: 12px;
      background: #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
    }

    .calib-fill {
      height: 100%;
      background: linear-gradient(90deg, #07B1C9, #4DB046);
      border-radius: 20px;
    }

    .calib-pct {
      font-size: 18px;
      font-weight: 800;
      color: #07B1C9;
      flex-shrink: 0;
      width: 48px;
      text-align: right;
    }

    .calib-explanation {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .calib-stats { display: flex; gap: 40px; }

    .calib-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }

    .stat-num { font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1; }

    .stat-lbl {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
    }

    /* ── Footer ── */
    .pdf-footer {
      background: #0f172a;
      padding: 22px 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255,255,255,0.75);
    }

    .footer-logo {
      width: 22px;
      height: 22px;
      object-fit: contain;
      filter: brightness(0) invert(1);
      opacity: 0.6;
    }

    .footer-note { font-size: 11px; color: rgba(255,255,255,0.35); text-align: center; }

    .footer-date { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-align: right; }
  `]
})
export class PdfReportTemplateComponent {
  @Input() dominantTraits: string = '';
  @Input() archetype: string = '';
  @Input() description: string = '';
  @Input() greeting: string = '';
  @Input() steamAreas: SteamArea[] = [];
  @Input() strengths: ProfileStrength[] = [];
  @Input() vocations: VocationRecommendation[] = [];
  @Input() careers: CareerRecommendation[] = [];
  @Input() calibration: CalibrationState | null = null;
  @Input() recommendations: UniversityRecommendation[] = [];
  @Input() currentDate: Date = new Date();

  private readonly AXIS_COLORS: Record<string, string> = {
    ciencia: '#07B1C9',
    tecnologia: '#6366F1',
    ingenieria: '#F88718',
    artes: '#EC4899',
    matematicas: '#4DB046',
  };

  getAxisColor(axis: string): string {
    return this.AXIS_COLORS[axis] ?? '#07B1C9';
  }
}
