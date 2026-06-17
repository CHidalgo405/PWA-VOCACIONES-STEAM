import { Injectable } from '@angular/core';
import type {
  LocalUniversityMatchResult,
  LocalVocationalTestResult
} from '../models/vocational-steam.models';

export interface UniversityExplanationInput {
  profile: LocalVocationalTestResult;
  match: LocalUniversityMatchResult;
}

export interface UniversityExplanationResult {
  personalizedExplanation: string;
  whyItMatches: string;
  mostCompatibleCareer: string;
  missingInformation: string;
  suggestedNextSteps: string[];
  dataSource: 'local' | 'mock';
}

@Injectable({
  providedIn: 'root'
})
export class UniversityAiExplanationService {
  buildGuardedPrompt(input: UniversityExplanationInput): string {
    const match = input.match;
    return [
      'Eres un orientador vocacional para jóvenes STEAM.',
      'Usa exclusivamente los datos estructurados provistos.',
      'Reglas obligatorias:',
      '- No inventes planes de estudio.',
      '- No inventes carreras.',
      '- No inventes universidades.',
      '- Si falta información, dilo claramente.',
      '- No cambies el porcentaje de match calculado por el algoritmo.',
      '- No presentes la orientación como decisión definitiva.',
      '',
      `Perfil: ${input.profile.strengthProfile.primaryCombination}`,
      `Confianza: ${input.profile.strengthProfile.confidence}`,
      `Universidad: ${match.university.name}`,
      `Distancia: ${match.distanceKm} km`,
      `Match calculado: ${match.matchTotal}%`,
      `Carreras compatibles: ${match.compatibleCareers.join(', ') || 'Sin datos suficientes'}`,
      `Programas disponibles reportados: ${(match.university.programs || []).join(', ') || 'Sin datos suficientes'}`,
      `Fuente de datos: ${match.dataSource}`,
      `Advertencias: ${match.warnings.join(' | ') || 'Ninguna'}`
    ].join('\n');
  }

  explainLocally(input: UniversityExplanationInput): UniversityExplanationResult {
    const match = input.match;
    const career = match.compatibleCareers[0] || 'una carrera por validar';
    const missingInformation = match.warnings.length
      ? match.warnings.join(' ')
      : 'Aun así, conviene validar requisitos, costos, convocatoria y plan de estudios en el sitio oficial.';

    return {
      personalizedExplanation: `${match.university.name} tiene un match calculado de ${match.matchTotal}% con tu perfil ${input.profile.strengthProfile.primaryCombination}. Este porcentaje viene del algoritmo local, no de la IA.`,
      whyItMatches: match.reasons.join(' '),
      mostCompatibleCareer: career,
      missingInformation,
      suggestedNextSteps: [
        'Revisar el sitio oficial de la universidad.',
        'Confirmar si la carrera compatible está disponible en ese campus.',
        'Comparar esta opción con al menos dos universidades más.'
      ],
      dataSource: 'local'
    };
  }
}
