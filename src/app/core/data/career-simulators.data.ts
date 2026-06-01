import { CareerSimulatorData } from '../models/career-simulator.models';

export const CAREER_SIMULATORS: CareerSimulatorData[] = [
  {
    careerId: 'epidemiologia',
    careerName: 'Epidemiología / Biología',
    description: 'Simula el rol de una epidemióloga manejando un brote de una enfermedad.',
    steps: [
      {
        id: 'epi_step_1_context',
        type: 'CONTEXT',
        title: 'Brote en la ciudad',
        content: 'Son las 9am. Eres epidemióloga. Llegaron datos de 3 semanas de un brote en 4 ciudades. Tu jefa necesita un reporte en 2 horas.'
      },
      {
        id: 'epi_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Contagios',
        content: 'Analiza los contagios mostrados en la tabla. ¿Cuál ciudad tiene la curva más preocupante?',
        metadata: {
          chartData: [
            { ciudad: 'Ciudad A', semana1: 10, semana2: 25, semana3: 80 },
            { ciudad: 'Ciudad B', semana1: 50, semana2: 55, semana3: 60 },
            { ciudad: 'Ciudad C', semana1: 5, semana2: 15, semana3: 20 },
            { ciudad: 'Ciudad D', semana1: 100, semana2: 90, semana3: 85 }
          ]
        },
        options: [
          {
            id: 'opt_ciudad_a',
            text: 'Ciudad A',
            steamTraitWeight: { ciencia: 5, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_ciudad_b',
            text: 'Ciudad B',
            steamTraitWeight: { ciencia: 2, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 }
          },
          {
            id: 'opt_ciudad_c',
            text: 'Ciudad C',
            steamTraitWeight: { ciencia: 1, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 }
          },
          {
            id: 'opt_ciudad_d',
            text: 'Ciudad D',
            steamTraitWeight: { ciencia: 2, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 }
          }
        ]
      },
      {
        id: 'epi_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Distribución de Vacunas',
        content: 'Solo hay vacunas para 2 de 4 ciudades. Elige cuáles recibirán las vacunas y explica por qué (máx 120 chars).',
        options: [
          { 
            id: 'opt_vacunas_ab', 
            text: 'Ciudad A y Ciudad B', 
            steamTraitWeight: { ciencia: 3, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 2 } 
          },
          { 
            id: 'opt_vacunas_ac', 
            text: 'Ciudad A y Ciudad C', 
            steamTraitWeight: { ciencia: 4, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 2 } 
          },
          { 
            id: 'opt_vacunas_ad', 
            text: 'Ciudad A y Ciudad D', 
            steamTraitWeight: { ciencia: 5, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 } 
          },
          { 
            id: 'opt_vacunas_bd', 
            text: 'Ciudad B y Ciudad D', 
            steamTraitWeight: { ciencia: 2, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 } 
          }
        ]
      },
      {
        id: 'epi_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad del Trabajo',
        content: 'El 40% del trabajo real de una epidemióloga es redactar reportes burocráticos para organismos de salud, no analizar datos.'
      },
      {
        id: 'epi_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Feedback del Sistema',
        content: 'Procesando tu razonamiento lógico y decisiones estratégicas...'
      },
      {
        id: 'epi_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Final',
        content: '¿Cómo te sentiste ante este reto de tomar decisiones de impacto social con recursos limitados y bajo presión?',
        options: [
          { id: 'emo_1', text: '1 - Muy abrumada/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Estresada/o pero resolutivo', steamTraitWeight: { ciencia: 1, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Neutral', steamTraitWeight: { ciencia: 2, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Cómoda/o', steamTraitWeight: { ciencia: 3, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi elemento', steamTraitWeight: { ciencia: 4, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'ux-ui-design',
    careerName: 'UX/UI Design',
    description: 'Simula el rol de diseñadora UX en una startup de salud mental.',
    steps: [
      {
        id: 'ux_step_1_context',
        type: 'CONTEXT',
        title: 'Diseño para la Salud Mental',
        content: 'Son las 10am. Eres diseñadora UX en una startup de salud mental. El equipo de desarrollo necesita el diseño del flujo de crisis en 3 horas.'
      },
      {
        id: 'ux_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Componentes',
        content: 'Se muestran 3 versiones de un mismo botón de "llamar a ayuda". ¿Cuál comunica mejor urgencia sin generar pánico? Explica brevemente por qué.',
        metadata: {
          uiComponents: [
            { id: 'btn_1', color: '#FF0000', label: '¡LLAMAR AHORA!', icon: 'alert-triangle' },
            { id: 'btn_2', color: '#FF8C00', label: 'Contactar ayuda', icon: 'phone' },
            { id: 'btn_3', color: '#4CAF50', label: 'Hablar con alguien', icon: 'user' }
          ]
        },
        options: [
          { 
            id: 'opt_btn_1', 
            text: 'Botón Rojo (Alarma visual)', 
            steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 0, artes: 1, matematicas: 0 } 
          },
          { 
            id: 'opt_btn_2', 
            text: 'Botón Naranja (Precaución y acción rápida)', 
            steamTraitWeight: { ciencia: 0, tecnologia: 2, ingenieria: 0, artes: 5, matematicas: 0 } 
          },
          { 
            id: 'opt_btn_3', 
            text: 'Botón Verde (Calma y apoyo)', 
            steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 0, artes: 3, matematicas: 0 } 
          }
        ]
      },
      {
        id: 'ux_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Conflicto con Stakeholders',
        content: 'El cliente rechaza el diseño diciendo: "no me convence el color". ¿Cómo respondes a esta situación?',
        options: [
          { 
            id: 'opt_yield', 
            text: 'Cedes completamente y cambias al color que piden', 
            steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 1, matematicas: 0 } 
          },
          { 
            id: 'opt_feedback', 
            text: 'Pides feedback específico sobre qué emociones les genera el color actual', 
            steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 0, artes: 4, matematicas: 0 } 
          },
          { 
            id: 'opt_defend', 
            text: 'Defiendes la decisión mostrando datos y ratios de accesibilidad', 
            steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 1, artes: 5, matematicas: 1 } 
          }
        ]
      },
      {
        id: 'ux_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'El Impacto del Color',
        content: 'Una sola decisión de color en una app de salud mental puede afectar la tasa de uso en un 23%, según estudios de UX en salud.'
      },
      {
        id: 'ux_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación de UX',
        content: 'Procesando tu razonamiento de diseño, accesibilidad y empatía del usuario...'
      },
      {
        id: 'ux_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Final',
        content: '¿Cómo te sentiste ante este reto de equilibrar empatía por el usuario, accesibilidad y las opiniones de los clientes?',
        options: [
          { id: 'emo_1', text: '1 - Muy frustrada/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Algo incómoda/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 1, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Neutral', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 2, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Manejable', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 3, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi elemento', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 4, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'ciencia-datos',
    careerName: 'Ciencia de Datos',
    description: 'Simula el rol de científica de datos analizando modelos predictivos bancarios.',
    steps: [
      {
        id: 'ds_step_1_context',
        type: 'CONTEXT',
        title: 'Problemas en el Modelo Predictivo',
        content: 'Son las 11am. Eres científica de datos en un banco. Tu modelo predijo que 200 clientes cancelarían. 180 no lo hicieron. Tu jefe quiere saber qué salió mal antes de la reunión de las 2pm.'
      },
      {
        id: 'ds_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Errores',
        content: 'Revisa la tabla de predicciones del modelo. ¿Dónde está el error principal de nuestro modelo?',
        metadata: {
          confusionMatrixInfo: [
            { tipo: 'Cancelaron y lo predijimos', cantidad: 20 },
            { tipo: 'No cancelaron pero dijimos que lo harían', cantidad: 180 },
            { tipo: 'No cancelaron y lo predijimos', cantidad: 5000 },
            { tipo: 'Cancelaron y no lo predijimos', cantidad: 5 }
          ]
        },
        options: [
          { 
            id: 'opt_falsos_positivos', 
            text: 'El modelo es demasiado pesimista (180 alarmas falsas)', 
            steamTraitWeight: { ciencia: 2, tecnologia: 3, ingenieria: 2, artes: 0, matematicas: 5 } 
          },
          { 
            id: 'opt_falsos_negativos', 
            text: 'El modelo falla en detectar a los que sí cancelan (5 no detectados)', 
            steamTraitWeight: { ciencia: 1, tecnologia: 1, ingenieria: 1, artes: 0, matematicas: 3 } 
          },
          { 
            id: 'opt_aciertos', 
            text: 'El modelo es excelente porque acertó en 5000 casos de no cancelación', 
            steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 } 
          }
        ]
      },
      {
        id: 'ds_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Decisión bajo Presión',
        content: 'Hay 3 causas posibles del error. Dado tu tiempo limitado antes de la reunión, ¿cuál investigas primero?',
        options: [
          { 
            id: 'opt_datos_viejos', 
            text: 'Datos de entrenamiento desactualizados', 
            steamTraitWeight: { ciencia: 4, tecnologia: 3, ingenieria: 2, artes: 0, matematicas: 4 } 
          },
          { 
            id: 'opt_sesgo_algoritmo', 
            text: 'Un sesgo interno en el algoritmo predictivo', 
            steamTraitWeight: { ciencia: 3, tecnologia: 4, ingenieria: 4, artes: 0, matematicas: 5 } 
          },
          { 
            id: 'opt_error_humano', 
            text: 'Un error en la extracción inicial de datos', 
            steamTraitWeight: { ciencia: 2, tecnologia: 5, ingenieria: 3, artes: 0, matematicas: 3 } 
          }
        ]
      },
      {
        id: 'ds_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad de los Datos',
        content: 'Los científicos de datos pasan en promedio el 60% de su tiempo limpiando y preparando datos, no construyendo modelos predictivos avanzados.'
      },
      {
        id: 'ds_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Análisis',
        content: 'Analizando tu lógica investigativa y capacidad de priorización...'
      },
      {
        id: 'ds_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Final',
        content: '¿Cómo te sentiste ante este reto analítico con tiempo limitado y alta expectativa del negocio?',
        options: [
          { id: 'emo_1', text: '1 - Demasiada presión / Bloqueado', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Estresado pero analítico', steamTraitWeight: { ciencia: 1, tecnologia: 1, ingenieria: 1, artes: 0, matematicas: 1 } },
          { id: 'emo_3', text: '3 - Neutral', steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 2, artes: 0, matematicas: 2 } },
          { id: 'emo_4', text: '4 - Interesante como puzzle', steamTraitWeight: { ciencia: 3, tecnologia: 3, ingenieria: 3, artes: 0, matematicas: 4 } },
          { id: 'emo_5', text: '5 - Me encanta resolver estos misterios', steamTraitWeight: { ciencia: 4, tecnologia: 4, ingenieria: 4, artes: 0, matematicas: 5 } }
        ]
      }
    ]
  }
];

export const CAREER_SIMULATOR_MAP = new Map<string, CareerSimulatorData>(
  CAREER_SIMULATORS.map(career => [career.careerId, career])
);
