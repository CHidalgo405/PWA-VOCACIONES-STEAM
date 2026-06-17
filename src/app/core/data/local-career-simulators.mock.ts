import type { CareerSimulatorData } from '../models/career-simulator.models';

export const LOCAL_CAREER_SIMULATORS: CareerSimulatorData[] = [
  {
    careerId: 'ingenieria-de-software-local',
    careerName: 'Ingeniería de Software',
    description: 'Resuelve una caída parcial de una app escolar y decide cómo priorizar el trabajo del equipo.',
    steamAreaName: 'Tecnología',
    areaClass: 'steam-tecnologia',
    areaEmoji: '💻',
    difficulty: 'media',
    tags: ['tecnología', 'lógica', 'decisiones'],
    colorToken: '#6366F1',
    icon: 'code-2',
    steps: [
      {
        id: 'soft-context',
        type: 'CONTEXT',
        title: 'Tu rol en la simulación',
        question: 'Eres parte de un equipo que mantiene una app para inscripciones escolares. Hoy algunos usuarios no pueden guardar sus datos.',
        metadata: {
          role: 'Desarrollador/a junior de producto',
          pressureContext: 'Hay dos horas antes de que cierre el periodo de inscripción.',
          ctaLabel: 'Entrar al equipo'
        }
      },
      {
        id: 'soft-data',
        type: 'DATA_ANALYSIS',
        title: 'Detecta el patrón',
        content: 'Revisa los reportes y elige la hipótesis más útil para iniciar.',
        metadata: {
          dataType: 'BAR_CHART',
          chartData: [
            { name: 'Móvil Android', errores: 78 },
            { name: 'Móvil iOS', errores: 22 },
            { name: 'Escritorio', errores: 14 }
          ]
        },
        options: [
          {
            id: 'soft-data-a',
            text: 'Priorizar Android porque concentra la mayoría de errores.',
            vocationalImpact: {
              areaWeights: { tecnologia: 4, matematicas: 2 },
              skillWeights: { analisis_de_datos: 3, pensamiento_logico: 2 },
              competencyWeights: { analisis: 4, pensamiento_logico: 3, toma_de_decisiones: 2 },
              consequence: 'El equipo empieza por el segmento con mayor impacto.',
              feedback: 'Mostraste análisis de datos y priorización.'
            }
          },
          {
            id: 'soft-data-b',
            text: 'Cambiar todo el formulario antes de revisar los reportes.',
            vocationalImpact: {
              areaWeights: { tecnologia: 1, arte: 1 },
              skillWeights: { creatividad: 1 },
              competencyWeights: { creatividad: 2, manejo_de_incertidumbre: 1 },
              consequence: 'Puede mejorar la experiencia, pero aumenta riesgo sin evidencia.',
              feedback: 'Propusiste una intervención amplia con poca evidencia inicial.'
            }
          },
          {
            id: 'soft-data-c',
            text: 'Pedir más datos y no tocar nada hasta mañana.',
            vocationalImpact: {
              areaWeights: { ciencia: 1 },
              skillWeights: { pensamiento_critico: 2 },
              competencyWeights: { etica: 1, analisis: 2 },
              consequence: 'Evitas cambios apresurados, pero el problema seguirá afectando usuarios.',
              feedback: 'Fuiste cauteloso/a, aunque faltó balancear urgencia e impacto.'
            }
          }
        ]
      },
      {
        id: 'soft-tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Decide bajo presión',
        content: 'Solo puedes elegir una acción antes del cierre.',
        options: [
          {
            id: 'soft-tradeoff-a',
            text: 'Crear un parche pequeño y monitorear errores en tiempo real.',
            metadata: {
              consecuencias_positivas: ['Reduce el impacto rápido', 'Permite aprender con datos reales'],
              consecuencias_negativas: ['No resuelve todos los casos', 'Requiere vigilancia constante']
            },
            vocationalImpact: {
              areaWeights: { tecnologia: 4, ingenieria: 2 },
              skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 2 },
              competencyWeights: { toma_de_decisiones: 3, manejo_de_incertidumbre: 3, pensamiento_logico: 2 },
              consequence: 'Aplicaste una solución incremental con control de riesgo.',
              feedback: 'Buena señal de ingeniería práctica y manejo de incertidumbre.'
            }
          },
          {
            id: 'soft-tradeoff-b',
            text: 'Desactivar inscripciones móviles hasta revisar todo.',
            metadata: {
              consecuencias_positivas: ['Evita registros incompletos', 'Da tiempo para investigar'],
              consecuencias_negativas: ['Afecta a usuarios sin computadora', 'Puede percibirse como injusto']
            },
            vocationalImpact: {
              areaWeights: { tecnologia: 2 },
              skillWeights: { pensamiento_critico: 2, comunicacion: 1 },
              competencyWeights: { etica: 3, toma_de_decisiones: 2 },
              consequence: 'Proteges datos, pero sacrificas acceso para muchas personas.',
              feedback: 'Consideraste riesgo y ética, con una decisión conservadora.'
            }
          }
        ]
      },
      {
        id: 'soft-surprise',
        type: 'SURPRISE_REVEAL',
        title: 'Dato inesperado',
        content: 'El error aparece sobre todo cuando la conexión es inestable. La solución no era solo visual ni solo de backend.',
        metadata: {
          followUpText: 'En software, muchas decisiones mezclan datos, empatía, restricciones técnicas y comunicación.',
          flipSideLabel: 'Consecuencia real',
          flipSideText: 'Una buena solución debe explicar qué cambia, qué queda pendiente y cómo se medirá si funcionó.',
          ctaLabel: 'Seguir al cierre'
        }
      },
      {
        id: 'soft-feedback',
        type: 'AI_FEEDBACK',
        title: 'Retroalimentación preliminar',
        metadata: {
          loadingMessages: ['Preparando retroalimentación con base en tus decisiones...']
        }
      },
      {
        id: 'soft-reflection',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Resultado final',
        question: '¿Cómo te sentiste tomando decisiones con datos incompletos?',
        options: [
          {
            id: 'soft-reflect-a',
            text: 'Me motivó; me gusta decidir con evidencia aunque falte información.',
            vocationalImpact: {
              areaWeights: { tecnologia: 2, matematicas: 2 },
              skillWeights: { pensamiento_critico: 2, analisis_de_datos: 2 },
              competencyWeights: { manejo_de_incertidumbre: 3, analisis: 2 },
              consequence: 'Mostraste comodidad con incertidumbre técnica.',
              feedback: 'Refuerza afinidad con Tecnología y Matemáticas.'
            }
          },
          {
            id: 'soft-reflect-b',
            text: 'Me incomodó, pero pude ordenar el problema paso a paso.',
            vocationalImpact: {
              areaWeights: { ingenieria: 2, tecnologia: 1 },
              skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 },
              competencyWeights: { pensamiento_logico: 2, manejo_de_incertidumbre: 1 },
              consequence: 'La incomodidad no impidió que estructuraras una respuesta.',
              feedback: 'Hay señal de resolución de problemas con margen para practicar.'
            }
          }
        ]
      }
    ]
  },
  {
    careerId: 'diseno-ux-ui-local',
    careerName: 'Diseño UX/UI',
    description: 'Mejora una pantalla de becas para que jóvenes encuentren información clara y justa.',
    steamAreaName: 'Arte',
    areaClass: 'steam-arte',
    areaEmoji: '🎨',
    difficulty: 'media',
    tags: ['creatividad', 'comunicación', 'producto'],
    colorToken: '#EC4899',
    icon: 'palette',
    steps: [
      {
        id: 'ux-context',
        type: 'CONTEXT',
        title: 'Tu rol en la simulación',
        question: 'Eres diseñador/a UX/UI. Una escuela reporta que muchos estudiantes abandonan la solicitud de beca porque no entienden los requisitos.',
        metadata: {
          role: 'Diseñador/a de producto digital',
          pressureContext: 'El equipo necesita una propuesta antes de publicar la convocatoria.',
          ctaLabel: 'Revisar la pantalla'
        }
      },
      {
        id: 'ux-data',
        type: 'DATA_ANALYSIS',
        title: 'Encuentra el bloqueo',
        content: 'Elige qué señal de los datos atenderías primero.',
        metadata: {
          chartData: [
            { tipo: 'No entiende requisitos', porcentaje: 62 },
            { tipo: 'No sabe fechas', porcentaje: 38 },
            { tipo: 'No encuentra documentos', porcentaje: 55 }
          ]
        },
        options: [
          {
            id: 'ux-data-a',
            text: 'Agrupar requisitos y documentos en una checklist clara.',
            vocationalImpact: {
              areaWeights: { arte: 4, tecnologia: 1 },
              skillWeights: { comunicacion: 3, creatividad: 2 },
              competencyWeights: { comunicacion: 4, creatividad: 2, analisis: 1 },
              consequence: 'Reduces carga cognitiva y haces visible el siguiente paso.',
              feedback: 'Mostraste comunicación visual y empatía práctica.'
            }
          },
          {
            id: 'ux-data-b',
            text: 'Agregar más texto para explicar todos los casos posibles.',
            vocationalImpact: {
              areaWeights: { ciencia: 1, arte: 1 },
              skillWeights: { pensamiento_critico: 1, comunicacion: 1 },
              competencyWeights: { analisis: 2 },
              consequence: 'Aporta información, pero puede hacer la pantalla más pesada.',
              feedback: 'Buscaste precisión, aunque faltó simplificar.'
            }
          }
        ]
      },
      {
        id: 'ux-tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Elige una solución',
        content: 'Tienes poco tiempo de desarrollo. ¿Qué priorizas?',
        options: [
          {
            id: 'ux-tradeoff-a',
            text: 'Prototipo simple con checklist, fechas y botón de ayuda.',
            metadata: {
              consecuencias_positivas: ['Se puede probar rápido', 'Reduce dudas principales'],
              consecuencias_negativas: ['No cubre todos los casos especiales']
            },
            vocationalImpact: {
              areaWeights: { arte: 4, tecnologia: 2 },
              skillWeights: { creatividad: 2, comunicacion: 3, resolucion_de_problemas: 1 },
              competencyWeights: { creatividad: 3, comunicacion: 3, toma_de_decisiones: 2 },
              consequence: 'Elegiste una solución clara y validable.',
              feedback: 'Señal fuerte de diseño centrado en usuarios.'
            }
          },
          {
            id: 'ux-tradeoff-b',
            text: 'Esperar investigación completa antes de diseñar.',
            metadata: {
              consecuencias_positivas: ['Evita supuestos', 'Puede mejorar precisión'],
              consecuencias_negativas: ['Retrasa una mejora urgente', 'Los estudiantes siguen confundidos']
            },
            vocationalImpact: {
              areaWeights: { ciencia: 2 },
              skillWeights: { pensamiento_critico: 2 },
              competencyWeights: { etica: 2, analisis: 2 },
              consequence: 'Valoraste evidencia, pero la urgencia pedía una mejora inicial.',
              feedback: 'Hay cautela analítica; conviene balancearla con acción.'
            }
          }
        ]
      },
      {
        id: 'ux-surprise',
        type: 'SURPRISE_REVEAL',
        title: 'Lo que no se veía',
        content: 'Al entrevistar usuarios, descubres que algunos no solicitan la beca porque creen que “no es para ellos”.',
        metadata: {
          followUpText: 'UX/UI no solo ordena pantallas: también detecta barreras emocionales, lenguaje confuso y decisiones injustas.',
          flipSideLabel: 'Reto ético',
          flipSideText: 'Una interfaz puede incluir o excluir. Debe ser clara sin prometer resultados falsos.',
          ctaLabel: 'Cerrar propuesta'
        }
      },
      {
        id: 'ux-feedback',
        type: 'AI_FEEDBACK',
        title: 'Retroalimentación preliminar',
        metadata: {
          loadingMessages: ['Leyendo tus decisiones de diseño y comunicación...']
        }
      },
      {
        id: 'ux-reflection',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Resultado final',
        question: '¿Qué parte del reto te interesó más?',
        options: [
          {
            id: 'ux-reflect-a',
            text: 'Entender a las personas y comunicar mejor.',
            vocationalImpact: {
              areaWeights: { arte: 3 },
              skillWeights: { comunicacion: 3, creatividad: 2 },
              competencyWeights: { comunicacion: 4, creatividad: 2 },
              consequence: 'Mostraste afinidad por comunicación y experiencia de usuario.',
              feedback: 'Refuerza Arte, Creatividad y Comunicación.'
            }
          },
          {
            id: 'ux-reflect-b',
            text: 'Medir si la solución realmente mejora el proceso.',
            vocationalImpact: {
              areaWeights: { tecnologia: 2, matematicas: 2 },
              skillWeights: { analisis_de_datos: 3, pensamiento_critico: 2 },
              competencyWeights: { analisis: 3, pensamiento_logico: 2 },
              consequence: 'Te interesó validar con datos y no solo diseñar bonito.',
              feedback: 'Conecta diseño con Tecnología y Matemáticas.'
            }
          }
        ]
      }
    ]
  }
];
