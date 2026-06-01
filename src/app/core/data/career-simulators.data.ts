import { CareerSimulatorData } from '../models/career-simulator.models';

export const CAREER_SIMULATORS: CareerSimulatorData[] = [
  {
    careerId: 'epidemiologia',
    careerName: 'Epidemiología / Biología',
    description: 'Simula el rol de una epidemióloga manejando un brote de una enfermedad.',
    steamAreaName: 'Ciencia',
    areaClass: 'steam-ciencia',
    areaEmoji: '🔬',
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
    steamAreaName: 'Artes',
    areaClass: 'steam-arte',
    areaEmoji: '🎨',
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
    steamAreaName: 'Matemáticas',
    areaClass: 'steam-matematicas',
    areaEmoji: '🧮',
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
  },
  {
    careerId: 'astrofisica',
    careerName: 'Astrofísica / Física',
    description: 'Simula el rol de astrofísica analizando espectros lumínicos y anomalías en un observatorio.',
    steamAreaName: 'Ciencia',
    areaClass: 'steam-ciencia',
    areaEmoji: '🔭',
    steps: [
      {
        id: 'astro_step_1_context',
        type: 'CONTEXT',
        title: 'Anomalía en el Espectro Estelar',
        content: 'Son las 11pm. Eres astrofísica en un observatorio. Los sensores acaban de detectar una fluctuación atípica de 0.8% en el brillo de una estrella cercana. Tu equipo tiene 3 horas antes de que salga del rango óptico del telescopio principal.'
      },
      {
        id: 'astro_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis del Espectro Infrarrojo',
        content: 'Revisas las lecturas electromagnéticas estelares de las últimas horas. ¿Cuál es tu primera hipótesis de trabajo sobre el origen del fenómeno?',
        metadata: {
          spectralAnalysis: [
            { banda: 'Infrarrojo Cercano (NIR)', caidaBrillo: '0.8%', patron: 'Periódico limpio' },
            { banda: 'Luz Visible', caidaBrillo: '0.1%', patron: 'Ruido electromagnético' },
            { banda: 'Rayos X', caidaBrillo: '0.0%', patron: 'Sin cambios estables' }
          ]
        },
        options: [
          {
            id: 'opt_transito_exoplaneta',
            text: 'Tránsito periódico de un exoplaneta masivo templado',
            steamTraitWeight: { ciencia: 5, tecnologia: 1, ingenieria: 0, artes: 0, matematicas: 4 }
          },
          {
            id: 'opt_manchas_solares',
            text: 'Fulgoraciones cromosféricas o manchas en la estrella misma',
            steamTraitWeight: { ciencia: 4, tecnologia: 1, ingenieria: 0, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_error_instrumental',
            text: 'Falla física de calibración o ruido en el sensor infrarrojo',
            steamTraitWeight: { ciencia: 2, tecnologia: 4, ingenieria: 3, artes: 0, matematicas: 2 }
          }
        ]
      },
      {
        id: 'astro_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Dilema de Tiempo de Observación',
        content: 'Verificar la anomalía exige reenfocar el telescopio principal de alta resolución, lo que te obligará a cancelar la observación programada de una Supernova distante que ocurre esta noche. ¿Qué decides?',
        options: [
          {
            id: 'opt_reenfocar_anomalia',
            text: 'Reenfocar telescopio para confirmar la anomalía espectral',
            steamTraitWeight: { ciencia: 5, tecnologia: 2, ingenieria: 1, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_mantener_supernova',
            text: 'Mantener observación de la Supernova y recolectar datos de archivo para la anomalía',
            steamTraitWeight: { ciencia: 3, tecnologia: 1, ingenieria: 0, artes: 0, matematicas: 4 }
          },
          {
            id: 'opt_dividir_tiempo',
            text: 'Dividir el tiempo de exposición a la mitad, arriesgando datos incompletos de ambos',
            steamTraitWeight: { ciencia: 1, tecnologia: 3, ingenieria: 2, artes: 0, matematicas: 2 }
          }
        ]
      },
      {
        id: 'astro_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad Cósmica',
        content: '¡El universo requiere paciencia! El 90% del trabajo real en astrofísica consiste en programar scripts en Python para limpiar ruido electromagnético de bases de datos antiguas, no en mirar el cosmos con tus propios ojos.'
      },
      {
        id: 'astro_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Enfoque Científico',
        content: 'Analizando tu método hipotético-deductivo y gestión de recursos astronómicos...'
      },
      {
        id: 'astro_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Estelar',
        content: '¿Cómo manejaste la presión de arriesgar una observación planificada y segura por ir en búsqueda de un fenómeno desconocido?',
        options: [
          { id: 'emo_1', text: '1 - Muy insegura/o y estresada/o', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Preocupada/o por los datos perdidos', steamTraitWeight: { ciencia: 1, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Decidida/o a pesar del riesgo', steamTraitWeight: { ciencia: 2, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Curiosa/o y motivada/o por explorar', steamTraitWeight: { ciencia: 3, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi elemento buscando misterios', steamTraitWeight: { ciencia: 4, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'inteligencia-artificial',
    careerName: 'Inteligencia Artificial / ML',
    description: 'Simula el rol de ingeniero de Machine Learning auditando sesgos algorítmicos éticos.',
    steamAreaName: 'Tecnología',
    areaClass: 'steam-tecnologia',
    areaEmoji: '🤖',
    steps: [
      {
        id: 'ai_step_1_context',
        type: 'CONTEXT',
        title: 'Sesgo Sistémico en Reclutamiento',
        content: 'Eres ingeniero de Machine Learning en una empresa de RRHH. Usuarios denuncian que tu modelo de IA descarta CVs que incluyen voluntariados de minorías o agrupaciones femeninas. Tu jefe exige resolverlo antes del lanzamiento comercial mañana.'
      },
      {
        id: 'ai_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Importancia de Atributos',
        content: 'Revisas el Feature Importance. El modelo penaliza palabras clave de inclusión. La base de datos histórica de contratación exitosa de 10 años está sesgada hacia perfiles masculinos. ¿Qué medida técnica tomas?',
        metadata: {
          biasAuditing: [
            { variable: 'Años de Experiencia', pesoRelativo: '+0.45', sesgoGenero: 'Neutral' },
            { variable: 'Afiliaciones Femeninas', pesoRelativo: '-0.38', sesgoGenero: 'Alto Femenino' },
            { variable: 'Universidad de Origen', pesoRelativo: '+0.25', sesgoGenero: 'Moderado' },
            { variable: 'Pasatiempos / Actividades', pesoRelativo: '-0.12', sesgoGenero: 'Neutral' }
          ]
        },
        options: [
          {
            id: 'opt_debiasing_algoritmico',
            text: 'Reentrenar aplicando Adversarial Debiasing (Penalización demográfica activa)',
            steamTraitWeight: { ciencia: 3, tecnologia: 5, ingenieria: 3, artes: 0, matematicas: 4 }
          },
          {
            id: 'opt_upsampling_sintetico',
            text: 'Balancear datos mediante SMOTE (Upsampling sintético de minorías en la base)',
            steamTraitWeight: { ciencia: 2, tecnologia: 4, ingenieria: 2, artes: 0, matematicas: 5 }
          },
          {
            id: 'opt_remover_atributos',
            text: 'Eliminar el atributo de voluntariados y clubes del dataset de entrenamiento',
            steamTraitWeight: { ciencia: 2, tecnologia: 3, ingenieria: 2, artes: 0, matematicas: 2 }
          }
        ]
      },
      {
        id: 'ai_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Precisión vs Equidad Algorítmica',
        content: 'Aplicar restricciones estrictas de paridad demográfica mitiga el sesgo, pero reduce la precisión comercial general del modelo de 94% a 89%. Ventas teme que los clientes prefieran la competencia. ¿Cómo procedes?',
        options: [
          {
            id: 'opt_mantener_equidad',
            text: 'Mantener equidad en 89% y convencer al cliente del valor ético del modelo',
            steamTraitWeight: { ciencia: 4, tecnologia: 5, ingenieria: 2, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_lanzar_preciso',
            text: 'Lanzar al 94% agregando filtros y auditoría humana en una etapa posterior',
            steamTraitWeight: { ciencia: 2, tecnologia: 4, ingenieria: 4, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_modelo_hibrido',
            text: 'Filtro híbrido: IA solo descarta CVs incompatibles obvios y pasa el resto a humanos',
            steamTraitWeight: { ciencia: 3, tecnologia: 3, ingenieria: 3, artes: 0, matematicas: 4 }
          }
        ]
      },
      {
        id: 'ai_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad Algorítmica',
        content: '¡Los algoritmos heredan nuestros prejuicios! El 80% del tiempo de un desarrollador de IA actual se destina a auditar, limpiar y debatir sobre la calidad y el sesgo ético de los datos, no a programar complejas redes neuronales.'
      },
      {
        id: 'ai_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Razonamiento Ético',
        content: 'Procesando tu capacidad de calibración algorítmica, ponderación de justicia social y precisión matemática...'
      },
      {
        id: 'ai_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Tecnológica',
        content: '¿Cómo lidiaste con el dilema de tener que comprometer la rentabilidad o precisión técnica del negocio por razones éticas y de inclusión social?',
        options: [
          { id: 'emo_1', text: '1 - Abrumada/o por las presiones ético-sociales', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Frustrada/o por los compromisos del algoritmo', steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Enfocada/o en encontrar un balance pragmático', steamTraitWeight: { ciencia: 0, tecnologia: 2, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Segura/o defendiendo la equidad como prioridad', steamTraitWeight: { ciencia: 0, tecnologia: 3, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - Apasionada/o por modelar tecnología justa', steamTraitWeight: { ciencia: 0, tecnologia: 4, ingenieria: 0, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'ciberseguridad',
    careerName: 'Ciberseguridad',
    description: 'Simula el rol de analista SecOps mitigando un ataque Zero-Day en una fintech.',
    steamAreaName: 'Tecnología',
    areaClass: 'steam-tecnologia',
    areaEmoji: '🛡️',
    steps: [
      {
        id: 'cyber_step_1_context',
        type: 'CONTEXT',
        title: 'Ataque Activo a Base de Datos',
        content: 'Son las 3am. Eres analista de Ciberseguridad (SecOps) en una fintech. Alarmas críticas notifican extracciones masivas de hashes de contraseñas de usuarios activos mediante un exploit desconocido (Zero-Day).'
      },
      {
        id: 'cyber_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Peticiones y Tráfico',
        content: 'Revisas las trazas de logs de la red central. El atacante inyecta código Base64 en peticiones SQL simulando tráfico normal. ¿Qué medida implementas inmediatamente para mitigar el ataque?',
        metadata: {
          trafficLogs: [
            { ipOrigen: '198.51.100.45 (VPN)', peticionesMin: '4,500', comandoDetectado: 'UNION SELECT BASE64(...)' },
            { ipOrigen: '203.0.113.12 (VPN)', peticionesMin: '3,800', comandoDetectado: 'UNION SELECT BASE64(...)' },
            { ipOrigen: '192.168.1.10 (Local)', peticionesMin: '42', comandoDetectado: 'Ninguno - Tráfico Interno' }
          ]
        },
        options: [
          {
            id: 'opt_honeypot_routing',
            text: 'Redirigir tráfico sospechoso a un Honeypot aislado para estudiar el exploit',
            steamTraitWeight: { ciencia: 4, tecnologia: 5, ingenieria: 2, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_bloquear_ips',
            text: 'Actualizar las reglas del firewall para bloquear inmediatamente las IPs VPN',
            steamTraitWeight: { ciencia: 2, tecnologia: 4, ingenieria: 3, artes: 0, matematicas: 1 }
          },
          {
            id: 'opt_apagar_api',
            text: 'Desactivar la API pública de transacciones temporalmente',
            steamTraitWeight: { ciencia: 1, tecnologia: 3, ingenieria: 4, artes: 0, matematicas: 1 }
          }
        ]
      },
      {
        id: 'cyber_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Dilema de Contención Crítica',
        content: 'Apagar el servidor central detiene la fuga y protege los datos pero cuesta $10,000 por minuto de inactividad, dañando la reputación de la fintech. Dejarlo encendido te permite rastrear al atacante pero expone más registros de contraseñas. ¿Qué decides?',
        options: [
          {
            id: 'opt_apagado_completo',
            text: 'Apagar la infraestructura entera de forma inmediata (Seguridad extrema)',
            steamTraitWeight: { ciencia: 1, tecnologia: 5, ingenieria: 4, artes: 0, matematicas: 1 }
          },
          {
            id: 'opt_aislamiento_bd',
            text: 'Aislar solo la base de datos de contraseñas, dejando la app con fallas parciales',
            steamTraitWeight: { ciencia: 3, tecnologia: 4, ingenieria: 4, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_parche_caliente',
            text: 'Mantener la app activa e intentar parchar el código SQL en producción',
            steamTraitWeight: { ciencia: 4, tecnologia: 3, ingenieria: 2, artes: 0, matematicas: 5 }
          }
        ]
      },
      {
        id: 'cyber_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad Defensiva',
        content: '¡La seguridad es una disciplina de paciencia! El 85% del tiempo de un profesional en ciberseguridad se destina a auditar reportes de cumplimiento normativo, redactar políticas y aplicar parches rutinarios, no a combatir hackers activos.'
      },
      {
        id: 'cyber_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Análisis de Ciberseguridad',
        content: 'Analizando tu instinto de contención, capacidad de reacción adversarial y gestión de riesgos sistémicos...'
      },
      {
        id: 'cyber_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Adversarial',
        content: '¿Cómo manejaste el estrés psicológico de saber que una mala decisión tuya en la madrugada podía comprometer los datos de miles de clientes?',
        options: [
          { id: 'emo_1', text: '1 - Pánico absoluto y ganas de delegar', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Presionada/o pero tratando de seguir el protocolo', steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Nervios bajo control y mente pragmática', steamTraitWeight: { ciencia: 0, tecnologia: 2, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Enfocada/o y motivada/o por mitigar el ataque', steamTraitWeight: { ciencia: 0, tecnologia: 3, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi elemento resolviendo crisis complejas', steamTraitWeight: { ciencia: 0, tecnologia: 4, ingenieria: 0, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'ingenieria-civil',
    careerName: 'Ingeniería Civil / Estructural',
    description: 'Simula el rol de ingeniera civil resolviendo fallas de pilar estructural en suelo inestable.',
    steamAreaName: 'Ingeniería',
    areaClass: 'steam-ingenieria',
    areaEmoji: '🏗️',
    steps: [
      {
        id: 'civil_step_1_context',
        type: 'CONTEXT',
        title: 'Inestabilidad del Suelo de Cimentación',
        content: 'Eres ingeniera civil diseñando los apoyos de un pilar de un puente colgante sobre un cañón rocoso. A 4 días de entregar los planos definitivos, el estudio geológico actualizado revela que el suelo es altamente arcilloso y propenso a deslizarse por lluvias.'
      },
      {
        id: 'civil_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Resistencia al Corte',
        content: 'Analizas los coeficientes de fricción interna y cohesión del terreno bajo diferentes niveles de humedad saturada. La carga del puente supera el límite de seguridad en lluvias extremas. ¿Cuál es tu propuesta técnica?',
        metadata: {
          soilData: [
            { estado: 'Seco', capacidadCargaKPa: '350', factorSeguridad: '2.1' },
            { estado: 'Humedad Moderada', capacidadCargaKPa: '280', factorSeguridad: '1.68' },
            { estado: 'Saturado (Lluvias)', capacidadCargaKPa: '190', factorSeguridad: '1.14 (Alerta < 1.5)' }
          ]
        },
        options: [
          {
            id: 'opt_pilotes_profundos',
            text: 'Rediseñar la cimentación agregando pilotes profundos de fricción de concreto',
            steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 5, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_estructura_aligerada',
            text: 'Cambiar el deck del puente a aleaciones ligeras de acero estructural hueco',
            steamTraitWeight: { ciencia: 3, tecnologia: 3, ingenieria: 4, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_muro_contencion',
            text: 'Diseñar un muro de contención periférico e inyección de lechada de cemento',
            steamTraitWeight: { ciencia: 2, tecnologia: 1, ingenieria: 3, artes: 0, matematicas: 2 }
          }
        ]
      },
      {
        id: 'civil_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Conflicto de Viabilidad Financiera',
        content: 'La opción de pilotes profundos asegura el pilar contra cualquier desastre meteorológico, pero incrementa el costo estructural del puente en un 35%. El municipio amenaza con suspender y archivar la obra si supera el presupuesto. ¿Qué decides?',
        options: [
          {
            id: 'opt_exigir_pilotes',
            text: 'Exigir pilotes de fricción profunda o rehusar firmar el diseño (Seguridad absoluta)',
            steamTraitWeight: { ciencia: 1, tecnologia: 1, ingenieria: 5, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_pilotes_medios',
            text: 'Redefinir a cimientos de mediana profundidad con drenajes mejorados (Seguridad moderada)',
            steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 4, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_sensores_monitoreo',
            text: 'Proceder con el diseño original agregando sensores activos de humedad para cierre del puente',
            steamTraitWeight: { ciencia: 3, tecnologia: 4, ingenieria: 2, artes: 0, matematicas: 3 }
          }
        ]
      },
      {
        id: 'civil_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad de la Obra',
        content: '¡Los planos son solo el comienzo! La ingeniería civil real implica una inmensa gestión de trámites gubernamentales, redacción de informes de impacto ambiental y la mediación diaria con contratistas que intentan usar materiales más baratos.'
      },
      {
        id: 'civil_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Análisis Civil',
        content: 'Procesando tu análisis de cargas mecánicas, gestión de presupuestos ajustados y responsabilidad estructural...'
      },
      {
        id: 'civil_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Estructural',
        content: '¿Cómo sentiste la responsabilidad de negociar la integridad física de una obra pública bajo estrictas restricciones económicas municipales?',
        options: [
          { id: 'emo_1', text: '1 - Ansiosa/o por la seguridad de la obra', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Estresada/o por los límites de costos', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 1, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Determinada/o a negociar un punto medio', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 2, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Segura/o y con posturas innegociables', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 3, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi elemento optimizando estructuras complejas', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 4, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'ingenieria-biomedica',
    careerName: 'Ingeniería Biomédica',
    description: 'Simula el rol de ingeniero biomédico solucionando fallas de interferencia electromagnética en marcapasos.',
    steamAreaName: 'Ingeniería',
    areaClass: 'steam-ingenieria',
    areaEmoji: '🧬',
    steps: [
      {
        id: 'biomed_step_1_context',
        type: 'CONTEXT',
        title: 'Interferencia Electromagnética Hospitalaria',
        content: 'Eres ingeniero biomédico. A semanas de iniciar pruebas clínicas con un marcapasos cardíaco de nueva generación, el departamento de control detecta que cargadores inalámbricos rápidos en la cercanía de pacientes inducen pequeñas anomalías de frecuencia.'
      },
      {
        id: 'biomed_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Atenuación de Señales',
        content: 'Revisas las señales en osciloscopio del implante expuesto a inducción de 13.56 MHz. El firmware confunde la interferencia con latidos reales del paciente. ¿Qué modificación propones?',
        metadata: {
          attenuationGraph: [
            { blindaje: 'Titanio Grado 5 (0.5mm)', atenuacionDb: '-24dB', pesoDispositivoG: '26g' },
            { blindaje: 'Titanio Grado 5 (1.0mm)', atenuacionDb: '-42dB', pesoDispositivoG: '42g (Sobrepeso)' },
            { blindaje: 'Titanio + Capa de Cobre', atenuacionDb: '-56dB', pesoDispositivoG: '31g (Toxicidad potencial)' }
          ]
        },
        options: [
          {
            id: 'opt_blindaje_fisico',
            text: 'Aumentar el blindaje de titanio al pilar de 1.0mm arriesgando peso y volumen del implante',
            steamTraitWeight: { ciencia: 3, tecnologia: 1, ingenieria: 5, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_filtro_firmware',
            text: 'Implementar un filtro digital adaptativo en firmware que consuma más batería del implante',
            steamTraitWeight: { ciencia: 2, tecnologia: 4, ingenieria: 4, artes: 0, matematicas: 4 }
          },
          {
            id: 'opt_restricciones_uso',
            text: 'Mantener diseño físico pero agregar contraindicaciones estrictas de uso en el manual',
            steamTraitWeight: { ciencia: 2, tecnologia: 1, ingenieria: 2, artes: 0, matematicas: 1 }
          }
        ]
      },
      {
        id: 'biomed_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'El Dilema Clínico-Regulatorio',
        content: 'Rediseñar físicamente la carcasa retrasará la aprobación regulatoria de la FDA por un año entero, dejando a cientos de pacientes en lista de espera sin tratamiento. Parchar el firmware reduce la vida de batería de 10 a 7 años, requiriendo cirugías de reemplazo de marcapasos prematuras. ¿Qué trade-off decides?',
        options: [
          {
            id: 'opt_retrasar_lanzamiento',
            text: 'Retrasar pruebas para rediseñar la protección física perfecta (Seguridad a largo plazo)',
            steamTraitWeight: { ciencia: 4, tecnologia: 2, ingenieria: 5, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_reducir_bateria',
            text: 'Reducir la batería a 7 años mediante firmware y priorizar llegada inmediata al paciente',
            steamTraitWeight: { ciencia: 2, tecnologia: 5, ingenieria: 4, artes: 0, matematicas: 3 }
          },
          {
            id: 'opt_reducir_funciones',
            text: 'Eliminar las antenas de conectividad inalámbrica, limitando el monitoreo externo',
            steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 3, artes: 0, matematicas: 4 }
          }
        ]
      },
      {
        id: 'biomed_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad de la Regulación',
        content: '¡La salud requiere meticulosidad! Un ingeniero biomédico dedica más del 50% de sus horas laborales a documentar carpetas de validación regulatoria y pruebas de biocompatibilidad, no a programar hardware inteligente.'
      },
      {
        id: 'biomed_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Enfoque Biomédico',
        content: 'Procesando tu enfoque de biocompatibilidad, resolución de riesgos biomédicos y balance de vida clínica de implantes...'
      },
      {
        id: 'biomed_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Biomédica',
        content: '¿Cómo sentiste la presión moral de elegir entre demorar un dispositivo de soporte vital o acortar la vida de batería obligando a futuras cirugías invasivas?',
        options: [
          { id: 'emo_1', text: '1 - Abrumada/o y con peso moral negativo', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Angustiada/o por la responsabilidad clínica', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 1, artes: 0, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Analítica/o evaluando probabilidades estadísticas', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 2, artes: 0, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Segura/o de priorizar la seguridad física definitiva', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 3, artes: 0, matematicas: 0 } },
          { id: 'emo_5', text: '5 - Decidida/o a resolver dilemas complejos de bioingeniería', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 4, artes: 0, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'animacion-3d',
    careerName: 'Animación 3D / Cine Digital',
    description: 'Simula el rol de artista de render y efectos resolviendo cuellos de botella técnicos en la toma final.',
    steamAreaName: 'Artes',
    areaClass: 'steam-arte',
    areaEmoji: '🎬',
    steps: [
      {
        id: 'anim_step_1_context',
        type: 'CONTEXT',
        title: 'Render de la Escena Clímax',
        content: 'Son las 5pm. Eres artista de render y efectos en un estudio de cine digital. El estreno del cortometraje es en 3 días. El director rechaza la toma principal argumentando que la luz se siente "fría y robótica", pero la granja de render está colapsada.'
      },
      {
        id: 'anim_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Análisis de Tiempos de Renderizado',
        content: 'Analizas los costos de cómputo por frame de la toma dramática. Modificar las luces volumétricas físicas en 3D triplicará el renderizado, superando el tiempo de entrega. ¿Cómo resuelves el balance de arte y cómputo?',
        metadata: {
          renderMetrics: [
            { tipoLuz: 'Física Volumétrica 3D', tiempoFrameMin: '45 min', fidelidadArtistica: 'Excelente (Hiperrealista)' },
            { tipoLuz: 'Iluminación 2D por Capas (Compositing)', tiempoFrameMin: '8 min', fidelidadArtistica: 'Muy Buena (Aceptable)' },
            { tipoLuz: 'Luces Planas Directas', tiempoFrameMin: '2 min', fidelidadArtistica: 'Pobre (Plano)' }
          ]
        },
        options: [
          {
            id: 'opt_compositing_2d',
            text: 'Simular calidez mediante técnicas de Compositing 2D en post-procesamiento rápido',
            steamTraitWeight: { ciencia: 0, tecnologia: 3, ingenieria: 1, artes: 5, matematicas: 0 }
          },
          {
            id: 'opt_optimizar_3d',
            text: 'Reducir la resolución de texturas lejanas y mantener luces volumétricas 3D simplificadas',
            steamTraitWeight: { ciencia: 0, tecnologia: 4, ingenieria: 3, artes: 4, matematicas: 0 }
          },
          {
            id: 'opt_bajar_fps',
            text: 'Reducir el framerate de la toma dramática de 24 fps a 12 fps para cortar frames a la mitad',
            steamTraitWeight: { ciencia: 0, tecnologia: 2, ingenieria: 2, artes: 1, matematicas: 0 }
          }
        ]
      },
      {
        id: 'anim_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'Dilema de Recursos y Dirección',
        content: 'El director exige iluminación volumétrica 3D hiperrealista completa de fondo y no tolera atajos 2D. Para lograrlo, debes solicitar una renta urgente de servidores en la nube excediendo el presupuesto sonoro del cortometraje, o pedir al equipo trabajar horas extra masivas el fin de semana. ¿Cómo procedes?',
        options: [
          {
            id: 'opt_defender_equipo',
            text: 'Plantarte firmemente y convencer al director de las ventajas técnicas del Compositing 2D',
            steamTraitWeight: { ciencia: 0, tecnologia: 2, ingenieria: 1, artes: 5, matematicas: 0 }
          },
          {
            id: 'opt_render_nube',
            text: 'Rentar servidores de renderizado en la nube sacrificando el presupuesto de mezcla sonora',
            steamTraitWeight: { ciencia: 0, tecnologia: 4, ingenieria: 2, artes: 4, matematicas: 0 }
          },
          {
            id: 'opt_maraton_trabajo',
            text: 'Organizar horas extra de fin de semana con el equipo para optimizar manualmente cada cuadro',
            steamTraitWeight: { ciencia: 0, tecnologia: 1, ingenieria: 3, artes: 3, matematicas: 0 }
          }
        ]
      },
      {
        id: 'anim_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad de los Pixeles',
        content: '¡Detrás de la magia hay rutinas! El 80% del tiempo de un animador 3D profesional se consume resolviendo fallas de colisiones de ropa o cabello, limpiando cachés caóticos de memoria y esperando barras de carga, no diseñando arte interactivo libre.'
      },
      {
        id: 'anim_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Criterio Artístico-Técnico',
        content: 'Procesando tu sentido de balance estético, optimización de recursos gráficos digitales y resiliencia ante directores creativos...'
      },
      {
        id: 'anim_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Creativa',
        content: '¿Cómo manejaste el choque entre la perfección estética requerida por dirección y los límites físicos estrictos del tiempo y el presupuesto de cómputo?',
        options: [
          { id: 'emo_1', text: '1 - Frustrada/o por la falta de recursos técnicos', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Agobiada/o por las exigencias estéticas del cliente', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 1, matematicas: 0 } },
          { id: 'emo_3', text: '3 - Pragmática/o buscando soluciones de optimización', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 2, matematicas: 0 } },
          { id: 'emo_4', text: '4 - Inspirada/o en defender la visión visual de la obra', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 3, matematicas: 0 } },
          { id: 'emo_5', text: '5 - En mi salsa equilibrando arte digital y cómputo', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 4, matematicas: 0 } }
        ]
      }
    ]
  },
  {
    careerId: 'actuaria',
    careerName: 'Actuaría / Finanzas Cuantitativas',
    description: 'Simula el rol de actuario determinando riesgos catastróficos costeros bajo extrema incertidumbre.',
    steamAreaName: 'Matemáticas',
    areaClass: 'steam-matematicas',
    areaEmoji: '📈',
    steps: [
      {
        id: 'act_step_1_context',
        type: 'CONTEXT',
        title: 'Aumento de Siniestralidad en Zonas de Riesgo',
        content: 'Son las 10am. Eres actuario en una reaseguradora. Una racha inédita de tormentas e inundaciones azota una costa declarada históricamente de bajo riesgo. El comité directivo necesita fijar la nueva prima anual de daños en 2 horas.'
      },
      {
        id: 'act_step_2_data',
        type: 'DATA_ANALYSIS',
        title: 'Modelación de Eventos de Cola',
        content: 'Analizas los datos de siniestros. La distribución Normal subestima drásticamente la probabilidad de catástrofes extremas ("cisnes negros"). Los nuevos datos tienen colas pesadas. ¿Qué distribución probabilística aplicas?',
        metadata: {
          riskModels: [
            { modelo: 'Distribución Normal (Histórico)', probabilidadPérdida10M: '0.12%', primaEstimada: '$120 USD' },
            { modelo: 'Distribución de Pareto (Cola Pesada)', probabilidadPérdida10M: '4.80%', primaEstimada: '$270 USD' },
            { modelo: 'Modelo Lognormal Empírico', probabilidadPérdida10M: '2.10%', primaEstimada: '$190 USD' }
          ]
        },
        options: [
          {
            id: 'opt_modelo_pareto',
            text: 'Migrar a una Distribución de Pareto para modelar correctamente los desastres de cola pesada',
            steamTraitWeight: { ciencia: 2, tecnologia: 1, ingenieria: 1, artes: 0, matematicas: 5 }
          },
          {
            id: 'opt_normal_multiplicador',
            text: 'Mantener la distribución Normal histórica aplicando un multiplicador arbitrario de seguridad de 1.5',
            steamTraitWeight: { ciencia: 1, tecnologia: 1, ingenieria: 1, artes: 0, matematicas: 2 }
          },
          {
            id: 'opt_lognormal_empirico',
            text: 'Utilizar el modelo Lognormal basado en los datos empíricos de pérdidas de los últimos 5 años',
            steamTraitWeight: { ciencia: 2, tecnologia: 2, ingenieria: 2, artes: 0, matematicas: 4 }
          }
        ]
      },
      {
        id: 'act_step_3_tradeoff',
        type: 'TRADEOFF_DECISION',
        title: 'El Dilema de Solvencia vs Impacto Social',
        content: 'El modelo matemático estricto exige elevar la prima un 120% para asegurar la solvencia de la empresa. Esto dejará al 60% de los pequeños propietarios de la costa incapaces de pagar y sin seguro ante huracanes. ¿Qué decides?',
        options: [
          {
            id: 'opt_prima_maxima',
            text: 'Subir la prima el 120% basándote rigurosamente en la solvencia matemática (Pareto)',
            steamTraitWeight: { ciencia: 2, tecnologia: 1, ingenieria: 1, artes: 0, matematicas: 5 }
          },
          {
            id: 'opt_mitigacion_reaseguro',
            text: 'Subir la prima solo un 40% y contratar reaseguro externo costoso para catástrofes extremas',
            steamTraitWeight: { ciencia: 3, tecnologia: 2, ingenieria: 2, artes: 0, matematicas: 4 }
          },
          {
            id: 'opt_exclusión_cobertura',
            text: 'Mantener la prima original pero excluir las inundaciones extremas del contrato (Limitar cobertura)',
            steamTraitWeight: { ciencia: 1, tecnologia: 3, ingenieria: 3, artes: 0, matematicas: 3 }
          }
        ]
      },
      {
        id: 'act_step_4_surprise',
        type: 'SURPRISE_REVEAL',
        title: 'La Realidad de la Incertidumbre',
        content: '¡El futuro es rebelde! El trabajo real de un actuario no es adivinar desastres con decimales, sino blindar financieramente una institución para que sobreviva robustamente cuando todas tus predicciones fallen inevitablemente.'
      },
      {
        id: 'act_step_5_ai',
        type: 'AI_FEEDBACK',
        title: 'Evaluación del Criterio Actuarial',
        content: 'Procesando tu rigor de modelado estadístico, optimización financiera ante cisnes negros y ética corporativa ante catástrofes...'
      },
      {
        id: 'act_step_6_emotional',
        type: 'EMOTIONAL_REFLECTION',
        title: 'Reflexión Matemática',
        content: '¿Cómo viviste la frialdad matemática de calcular riesgos devastadores que afectan directamente la viabilidad del hogar de miles de personas?',
        options: [
          { id: 'emo_1', text: '1 - Abrumada/o y con angustia social', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 } },
          { id: 'emo_2', text: '2 - Preocupada/o por el impacto de los precios en las personas', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 1 } },
          { id: 'emo_3', text: '3 - Objetiva/o enfocada/o en mantener la solidez de la firma', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 2 } },
          { id: 'emo_4', text: '4 - Motivada/o por estructurar una solución de mitigación sólida', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 3 } },
          { id: 'emo_5', text: '5 - Cómoda/o en modelado probabilístico ante el caos', steamTraitWeight: { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 4 } }
        ]
      }
    ]
  }
];

export const CAREER_SIMULATOR_MAP = new Map<string, CareerSimulatorData>(
  CAREER_SIMULATORS.map(career => [career.careerId, career])
);
