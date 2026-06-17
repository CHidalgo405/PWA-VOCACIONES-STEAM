import type {
  ComplementarySkillDefinition,
  ComplementarySkillWeightMap,
  NearbySteamUniversity,
  SteamAreaDefinition,
  SteamAreaWeightMap,
  SteamCareerVocationalMatrixItem,
  SteamCareerRecommendation,
  SteamCareerWeightProfile,
  UniversityCareerMatch,
  VocationalQuestion
} from '../models/vocational-steam.models';

export const EMPTY_STEAM_AREA_WEIGHTS: SteamAreaWeightMap = {
  ciencia: 0,
  tecnologia: 0,
  ingenieria: 0,
  arte: 0,
  matematicas: 0
};

export const EMPTY_COMPLEMENTARY_SKILL_WEIGHTS: ComplementarySkillWeightMap = {
  pensamiento_logico: 0,
  creatividad: 0,
  comunicacion: 0,
  resolucion_de_problemas: 0,
  trabajo_en_equipo: 0,
  liderazgo: 0,
  analisis_de_datos: 0,
  pensamiento_critico: 0
};

export const STEAM_AREA_DEFINITIONS: SteamAreaDefinition[] = [
  {
    id: 'ciencia',
    apiKey: 'ciencia',
    label: 'Ciencia',
    shortLabel: 'S',
    color: '#07B1C9',
    gradientStart: '#07B1C9',
    gradientEnd: '#0E9AA7',
    icon: 'flask-conical',
    description: 'Explora fenomenos, formula hipotesis y valida evidencia.',
    dataSource: 'local'
  },
  {
    id: 'tecnologia',
    apiKey: 'tecnologia',
    label: 'Tecnología',
    shortLabel: 'T',
    color: '#6366F1',
    gradientStart: '#6366F1',
    gradientEnd: '#07B1C9',
    icon: 'cpu',
    description: 'Construye soluciones digitales, automatiza procesos y usa sistemas.',
    dataSource: 'local'
  },
  {
    id: 'ingenieria',
    apiKey: 'ingenieria',
    label: 'Ingeniería',
    shortLabel: 'E',
    color: '#F88718',
    gradientStart: '#F88718',
    gradientEnd: '#FBBF24',
    icon: 'wrench',
    description: 'Disena, prototipa y mejora mecanismos, procesos e infraestructura.',
    dataSource: 'local'
  },
  {
    id: 'arte',
    apiKey: 'artes',
    label: 'Arte',
    shortLabel: 'A',
    color: '#EC4899',
    gradientStart: '#EC4899',
    gradientEnd: '#A855F7',
    icon: 'palette',
    description: 'Comunica ideas, crea experiencias y resuelve con sensibilidad visual.',
    dataSource: 'local'
  },
  {
    id: 'matematicas',
    apiKey: 'matematicas',
    label: 'Matemáticas',
    shortLabel: 'M',
    color: '#4DB046',
    gradientStart: '#4DB046',
    gradientEnd: '#22D3EE',
    icon: 'sigma',
    description: 'Modela patrones, optimiza decisiones y razona con precision.',
    dataSource: 'local'
  }
];

export const COMPLEMENTARY_SKILL_DEFINITIONS: ComplementarySkillDefinition[] = [
  {
    id: 'pensamiento_logico',
    label: 'Pensamiento logico',
    description: 'Ordena informacion y sigue cadenas de causa y efecto.',
    icon: 'binary',
    dataSource: 'local'
  },
  {
    id: 'creatividad',
    label: 'Creatividad',
    description: 'Genera alternativas, conceptos y soluciones originales.',
    icon: 'sparkles',
    dataSource: 'local'
  },
  {
    id: 'comunicacion',
    label: 'Comunicacion',
    description: 'Explica ideas y adapta mensajes a distintas audiencias.',
    icon: 'messages-square',
    dataSource: 'local'
  },
  {
    id: 'resolucion_de_problemas',
    label: 'Resolucion de problemas',
    description: 'Divide retos complejos y encuentra caminos accionables.',
    icon: 'puzzle',
    dataSource: 'local'
  },
  {
    id: 'trabajo_en_equipo',
    label: 'Trabajo en equipo',
    description: 'Colabora, coordina esfuerzos y aprovecha fortalezas del grupo.',
    icon: 'users',
    dataSource: 'local'
  },
  {
    id: 'liderazgo',
    label: 'Liderazgo',
    description: 'Toma iniciativa, prioriza y ayuda a otros a avanzar.',
    icon: 'flag',
    dataSource: 'local'
  },
  {
    id: 'analisis_de_datos',
    label: 'Analisis de datos',
    description: 'Interpreta datos, identifica patrones y sustenta decisiones.',
    icon: 'chart-no-axes-combined',
    dataSource: 'local'
  },
  {
    id: 'pensamiento_critico',
    label: 'Pensamiento critico',
    description: 'Cuestiona supuestos, compara evidencia y detecta riesgos.',
    icon: 'search-check',
    dataSource: 'local'
  }
];

export const MOCK_VOCATIONAL_QUESTIONS: VocationalQuestion[] = [
  {
    id: 'local-q-001',
    order: 1,
    text: 'Que tipo de problema te llama mas la atencion resolver?',
    category: 'exploracion_cientifica',
    measurementType: 'interes',
    isActive: true,
    dataSource: 'mock',
    tags: ['interes', 'problemas'],
    options: [
      {
        id: 'local-q-001-a',
        letter: 'A',
        text: 'Entender por que ocurre un fenomeno natural o social.',
        areaWeights: { ciencia: 4, matematicas: 1 },
        skillWeights: { pensamiento_critico: 2, analisis_de_datos: 1 }
      },
      {
        id: 'local-q-001-b',
        letter: 'B',
        text: 'Crear una herramienta digital que facilite una tarea.',
        areaWeights: { tecnologia: 4, ingenieria: 1 },
        skillWeights: { pensamiento_logico: 2, resolucion_de_problemas: 2 }
      },
      {
        id: 'local-q-001-c',
        letter: 'C',
        text: 'Disenar una experiencia visual o narrativa para comunicar una idea.',
        areaWeights: { arte: 4, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 2 }
      },
      {
        id: 'local-q-001-d',
        letter: 'D',
        text: 'Optimizar un proceso, maquina o sistema para que funcione mejor.',
        areaWeights: { ingenieria: 4, matematicas: 1 },
        skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-001-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-002',
    order: 2,
    text: 'En cual de estas actividades sientes que podrias desempenarte mejor?',
    category: 'construccion_tecnologica',
    measurementType: 'habilidad_percibida',
    isActive: true,
    dataSource: 'mock',
    tags: ['habilidad', 'autoeficacia'],
    options: [
      {
        id: 'local-q-002-a',
        letter: 'A',
        text: 'Detectar patrones en datos, tablas o graficas.',
        areaWeights: { matematicas: 3, ciencia: 1, tecnologia: 1 },
        skillWeights: { analisis_de_datos: 3, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-002-b',
        letter: 'B',
        text: 'Armar, reparar o mejorar un objeto, maqueta o circuito.',
        areaWeights: { ingenieria: 3, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-002-c',
        letter: 'C',
        text: 'Explicar una idea compleja con imagenes, historias o ejemplos.',
        areaWeights: { arte: 3, ciencia: 1 },
        skillWeights: { comunicacion: 3, creatividad: 2 }
      },
      {
        id: 'local-q-002-d',
        letter: 'D',
        text: 'Coordinar personas para que un proyecto avance ordenadamente.',
        areaWeights: { ingenieria: 2, arte: 1 },
        skillWeights: { liderazgo: 3, trabajo_en_equipo: 2 }
      },
      {
        id: 'local-q-002-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-003',
    order: 3,
    text: 'Cual experiencia has tenido mas cerca en la escuela, casa o tiempo libre?',
    category: 'aprendizaje_autonomo',
    measurementType: 'experiencia_previa',
    isActive: true,
    dataSource: 'mock',
    tags: ['experiencia', 'contexto'],
    options: [
      {
        id: 'local-q-003-a',
        letter: 'A',
        text: 'Hacer un experimento, observar resultados o investigar evidencia.',
        areaWeights: { ciencia: 4, matematicas: 1 },
        skillWeights: { pensamiento_critico: 2, analisis_de_datos: 2 }
      },
      {
        id: 'local-q-003-b',
        letter: 'B',
        text: 'Usar programacion, apps, IA o herramientas digitales para resolver algo.',
        areaWeights: { tecnologia: 4, matematicas: 1 },
        skillWeights: { pensamiento_logico: 2, analisis_de_datos: 1 }
      },
      {
        id: 'local-q-003-c',
        letter: 'C',
        text: 'Construir, desmontar, reparar o adaptar algo fisico.',
        areaWeights: { ingenieria: 4, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 2, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-003-d',
        letter: 'D',
        text: 'Crear una pieza visual, musical, audiovisual o una presentacion.',
        areaWeights: { arte: 4, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 1 }
      },
      {
        id: 'local-q-003-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-004',
    order: 4,
    text: 'Cuando necesitas tomar una decision dificil, que haces con mas frecuencia?',
    category: 'razonamiento_cuantitativo',
    measurementType: 'estilo_de_pensamiento',
    isActive: true,
    dataSource: 'mock',
    tags: ['razonamiento', 'decision'],
    options: [
      {
        id: 'local-q-004-a',
        letter: 'A',
        text: 'Comparo datos y busco la opcion con mejor evidencia.',
        areaWeights: { ciencia: 2, matematicas: 3 },
        skillWeights: { analisis_de_datos: 3, pensamiento_critico: 2 }
      },
      {
        id: 'local-q-004-b',
        letter: 'B',
        text: 'Imagino escenarios y pruebo soluciones pequenas antes de decidir.',
        areaWeights: { ingenieria: 2, tecnologia: 2 },
        skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-004-c',
        letter: 'C',
        text: 'Pienso en como se entendera o sentira para otras personas.',
        areaWeights: { arte: 3, ciencia: 1 },
        skillWeights: { comunicacion: 2, pensamiento_critico: 1 }
      },
      {
        id: 'local-q-004-d',
        letter: 'D',
        text: 'Consulto al equipo y organizo un plan de accion.',
        areaWeights: { ingenieria: 2 },
        skillWeights: { trabajo_en_equipo: 3, liderazgo: 2 }
      },
      {
        id: 'local-q-004-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-005',
    order: 5,
    text: 'Que impacto te motivaria mas en una carrera STEAM?',
    category: 'diseno_y_creatividad',
    measurementType: 'motivacion',
    isActive: true,
    dataSource: 'mock',
    tags: ['motivacion', 'impacto'],
    options: [
      {
        id: 'local-q-005-a',
        letter: 'A',
        text: 'Mejorar salud, ambiente o conocimiento cientifico.',
        areaWeights: { ciencia: 4, ingenieria: 1 },
        skillWeights: { pensamiento_critico: 2, resolucion_de_problemas: 1 }
      },
      {
        id: 'local-q-005-b',
        letter: 'B',
        text: 'Crear tecnologia util para muchas personas.',
        areaWeights: { tecnologia: 4, matematicas: 1 },
        skillWeights: { pensamiento_logico: 2, comunicacion: 1 }
      },
      {
        id: 'local-q-005-c',
        letter: 'C',
        text: 'Disenar experiencias, productos o mensajes memorables.',
        areaWeights: { arte: 4, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 2 }
      },
      {
        id: 'local-q-005-d',
        letter: 'D',
        text: 'Construir soluciones fisicas o sistemas que hagan mas eficiente una comunidad.',
        areaWeights: { ingenieria: 4, matematicas: 1 },
        skillWeights: { resolucion_de_problemas: 3, liderazgo: 1 }
      },
      {
        id: 'local-q-005-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-006',
    order: 6,
    text: 'Si un proyecto no sale bien despues de varios intentos, que reaccion se parece mas a ti?',
    category: 'resiliencia_vocacional',
    measurementType: 'tolerancia_a_frustracion',
    isActive: true,
    dataSource: 'mock',
    tags: ['frustracion', 'resiliencia'],
    options: [
      {
        id: 'local-q-006-a',
        letter: 'A',
        text: 'Reviso los datos para encontrar donde se rompio la logica.',
        areaWeights: { matematicas: 3, ciencia: 2 },
        skillWeights: { pensamiento_logico: 2, pensamiento_critico: 2 }
      },
      {
        id: 'local-q-006-b',
        letter: 'B',
        text: 'Hago otra version del prototipo y pruebo una variable a la vez.',
        areaWeights: { ingenieria: 3, tecnologia: 2 },
        skillWeights: { resolucion_de_problemas: 3, analisis_de_datos: 1 }
      },
      {
        id: 'local-q-006-c',
        letter: 'C',
        text: 'Busco retroalimentacion para entender si la idea se comunica bien.',
        areaWeights: { arte: 2, ciencia: 1 },
        skillWeights: { comunicacion: 3, trabajo_en_equipo: 1 }
      },
      {
        id: 'local-q-006-d',
        letter: 'D',
        text: 'Pido apoyo, reorganizo tareas y mantengo al equipo enfocado.',
        areaWeights: { ingenieria: 1, arte: 1 },
        skillWeights: { liderazgo: 3, trabajo_en_equipo: 3 }
      },
      {
        id: 'local-q-006-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  },
  {
    id: 'local-q-007',
    order: 7,
    text: 'Como prefieres aprender algo nuevo y retador?',
    category: 'aprendizaje_autonomo',
    measurementType: 'preferencia_de_aprendizaje',
    isActive: true,
    dataSource: 'mock',
    tags: ['aprendizaje', 'preferencia'],
    options: [
      {
        id: 'local-q-007-a',
        letter: 'A',
        text: 'Leyendo, observando ejemplos y comprobando conceptos paso a paso.',
        areaWeights: { ciencia: 2, matematicas: 2 },
        skillWeights: { pensamiento_critico: 2, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-007-b',
        letter: 'B',
        text: 'Probando herramientas y aprendiendo por ensayo y error.',
        areaWeights: { tecnologia: 3, ingenieria: 1 },
        skillWeights: { resolucion_de_problemas: 2, pensamiento_logico: 1 }
      },
      {
        id: 'local-q-007-c',
        letter: 'C',
        text: 'Creando algo propio para entenderlo mejor.',
        areaWeights: { arte: 3, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 1 }
      },
      {
        id: 'local-q-007-d',
        letter: 'D',
        text: 'Aprendiendo con otras personas, explicando y recibiendo retroalimentacion.',
        areaWeights: { arte: 1, ingenieria: 1 },
        skillWeights: { trabajo_en_equipo: 3, comunicacion: 2 }
      },
      {
        id: 'local-q-007-e',
        letter: 'E',
        text: 'No lo he probado / No estoy seguro.',
        areaWeights: EMPTY_STEAM_AREA_WEIGHTS,
        skillWeights: EMPTY_COMPLEMENTARY_SKILL_WEIGHTS,
        isNeutral: true,
        scoringPolicy: 'no_penalty',
        value: 0
      }
    ]
  }
];

export const MOCK_STEAM_CAREERS: SteamCareerRecommendation[] = [
  {
    id: 'career-data-science',
    slug: 'ciencia-de-datos',
    name: 'Ciencia de Datos',
    description: 'Convierte datos en patrones, predicciones y decisiones utiles.',
    primaryArea: 'matematicas',
    relatedAreas: ['tecnologia', 'ciencia'],
    complementarySkills: ['analisis_de_datos', 'pensamiento_logico', 'pensamiento_critico'],
    matchPercentage: 92,
    reasons: ['Alta afinidad con analisis numerico', 'Requiere pensamiento critico y tecnologia'],
    dataSource: 'mock'
  },
  {
    id: 'career-software-engineering',
    slug: 'ingenieria-de-software',
    name: 'Ingeniería de Software',
    description: 'Disena y construye sistemas digitales para resolver problemas reales.',
    primaryArea: 'tecnologia',
    relatedAreas: ['ingenieria', 'matematicas'],
    complementarySkills: ['pensamiento_logico', 'resolucion_de_problemas', 'trabajo_en_equipo'],
    matchPercentage: 90,
    reasons: ['Combina tecnologia con estructura de ingenieria', 'Valora iteracion y colaboracion'],
    dataSource: 'mock'
  },
  {
    id: 'career-biotechnology',
    slug: 'biotecnologia',
    name: 'Biotecnología',
    description: 'Aplica ciencia y tecnologia para mejorar salud, ambiente y produccion.',
    primaryArea: 'ciencia',
    relatedAreas: ['tecnologia', 'ingenieria'],
    complementarySkills: ['pensamiento_critico', 'analisis_de_datos', 'resolucion_de_problemas'],
    matchPercentage: 88,
    reasons: ['Fuerte base cientifica', 'Necesita analisis experimental'],
    dataSource: 'mock'
  },
  {
    id: 'career-ux-ui-design',
    slug: 'ux-ui-design',
    name: 'Diseño UX/UI',
    description: 'Crea experiencias digitales claras, utiles y humanas.',
    primaryArea: 'arte',
    relatedAreas: ['tecnologia', 'ciencia'],
    complementarySkills: ['creatividad', 'comunicacion', 'pensamiento_critico'],
    matchPercentage: 86,
    reasons: ['Une creatividad con tecnologia', 'Requiere comunicar y validar ideas'],
    dataSource: 'mock'
  }
];

export const MOCK_CAREER_WEIGHT_PROFILES: SteamCareerWeightProfile[] = [
  {
    careerId: 'career-data-science',
    areaWeights: { ciencia: 18, tecnologia: 24, ingenieria: 10, arte: 4, matematicas: 44 },
    skillWeights: {
      pensamiento_logico: 18,
      creatividad: 4,
      comunicacion: 8,
      resolucion_de_problemas: 12,
      trabajo_en_equipo: 6,
      liderazgo: 2,
      analisis_de_datos: 30,
      pensamiento_critico: 20
    },
    dataSource: 'mock'
  },
  {
    careerId: 'career-software-engineering',
    areaWeights: { ciencia: 6, tecnologia: 42, ingenieria: 28, arte: 4, matematicas: 20 },
    skillWeights: {
      pensamiento_logico: 24,
      creatividad: 6,
      comunicacion: 8,
      resolucion_de_problemas: 24,
      trabajo_en_equipo: 16,
      liderazgo: 6,
      analisis_de_datos: 8,
      pensamiento_critico: 8
    },
    dataSource: 'mock'
  },
  {
    careerId: 'career-biotechnology',
    areaWeights: { ciencia: 46, tecnologia: 16, ingenieria: 18, arte: 2, matematicas: 18 },
    skillWeights: {
      pensamiento_logico: 14,
      creatividad: 6,
      comunicacion: 8,
      resolucion_de_problemas: 18,
      trabajo_en_equipo: 12,
      liderazgo: 4,
      analisis_de_datos: 18,
      pensamiento_critico: 20
    },
    dataSource: 'mock'
  },
  {
    careerId: 'career-ux-ui-design',
    areaWeights: { ciencia: 10, tecnologia: 24, ingenieria: 8, arte: 44, matematicas: 14 },
    skillWeights: {
      pensamiento_logico: 8,
      creatividad: 28,
      comunicacion: 22,
      resolucion_de_problemas: 12,
      trabajo_en_equipo: 10,
      liderazgo: 4,
      analisis_de_datos: 6,
      pensamiento_critico: 10
    },
    dataSource: 'mock'
  }
];

export const MOCK_STEAM_CAREER_MATRIX: SteamCareerVocationalMatrixItem[] = [
  {
    id: 'career-software-engineering',
    slug: 'ingenieria-de-software',
    name: 'Ingeniería de Software',
    primaryArea: 'tecnologia',
    secondaryAreas: ['ingenieria', 'matematicas'],
    shortDescription: 'Disena, construye y mantiene aplicaciones, plataformas y sistemas digitales.',
    relatedSubjects: ['Programación', 'Bases de datos', 'Arquitectura de software', 'Matemáticas discretas'],
    commonActivities: ['Crear aplicaciones', 'Resolver bugs', 'Disenar APIs', 'Trabajar con equipos agiles'],
    requiredSkills: ['pensamiento_logico', 'resolucion_de_problemas', 'trabajo_en_equipo', 'comunicacion'],
    perceivedDifficulty: 'alta',
    jobOutcomes: ['Desarrollador de software', 'Arquitecto de software', 'Ingeniero frontend/backend', 'DevOps junior'],
    profileMatchReasons: [
      'Encaja con perfiles orientados a tecnologia y solucion de problemas.',
      'Aprovecha pensamiento logico y colaboracion tecnica.'
    ],
    vocationalWeights: {
      areas: { ciencia: 8, tecnologia: 36, ingenieria: 24, arte: 6, matematicas: 26 },
      skills: {
        pensamiento_logico: 28,
        creatividad: 8,
        comunicacion: 12,
        resolucion_de_problemas: 30,
        trabajo_en_equipo: 22
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-data-science',
    slug: 'ciencia-de-datos',
    name: 'Ciencia de Datos',
    primaryArea: 'matematicas',
    secondaryAreas: ['tecnologia', 'ciencia'],
    shortDescription: 'Convierte datos en modelos, predicciones y decisiones utiles.',
    relatedSubjects: ['Estadistica', 'Programación', 'Algebra lineal', 'Visualizacion de datos'],
    commonActivities: ['Limpiar datos', 'Entrenar modelos', 'Crear dashboards', 'Explicar hallazgos'],
    requiredSkills: ['analisis_de_datos', 'pensamiento_logico', 'pensamiento_critico', 'comunicacion'],
    perceivedDifficulty: 'alta',
    jobOutcomes: ['Analista de datos', 'Cientifico de datos', 'Ingeniero de machine learning', 'BI analyst'],
    profileMatchReasons: [
      'Encaja con perfiles matematicos y analiticos.',
      'Premia la capacidad de interpretar datos y comunicar evidencia.'
    ],
    vocationalWeights: {
      areas: { ciencia: 20, tecnologia: 24, ingenieria: 8, arte: 4, matematicas: 44 },
      skills: {
        pensamiento_logico: 26,
        creatividad: 6,
        comunicacion: 14,
        resolucion_de_problemas: 18,
        trabajo_en_equipo: 10,
        analisis_de_datos: 32,
        pensamiento_critico: 24
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-biotechnology',
    slug: 'biotecnologia',
    name: 'Biotecnología',
    primaryArea: 'ciencia',
    secondaryAreas: ['tecnologia', 'ingenieria'],
    shortDescription: 'Aplica biologia, tecnologia y procesos para resolver retos de salud, ambiente y produccion.',
    relatedSubjects: ['Biologia', 'Quimica', 'Bioinformatica', 'Procesos de laboratorio'],
    commonActivities: ['Analizar muestras', 'Documentar experimentos', 'Interpretar resultados', 'Optimizar procesos biologicos'],
    requiredSkills: ['pensamiento_critico', 'analisis_de_datos', 'resolucion_de_problemas', 'trabajo_en_equipo'],
    perceivedDifficulty: 'alta',
    jobOutcomes: ['Tecnico de laboratorio', 'Investigador junior', 'Especialista en bioprocesos', 'Analista de calidad'],
    profileMatchReasons: [
      'Encaja con curiosidad cientifica y tolerancia al analisis experimental.',
      'Requiere rigor, evidencia y resolucion de problemas.'
    ],
    vocationalWeights: {
      areas: { ciencia: 44, tecnologia: 16, ingenieria: 20, arte: 2, matematicas: 18 },
      skills: {
        pensamiento_logico: 16,
        creatividad: 8,
        comunicacion: 10,
        resolucion_de_problemas: 24,
        trabajo_en_equipo: 18,
        analisis_de_datos: 20,
        pensamiento_critico: 28
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-ux-ui-design',
    slug: 'ux-ui-design',
    name: 'Diseño UX/UI',
    primaryArea: 'arte',
    secondaryAreas: ['tecnologia', 'ciencia'],
    shortDescription: 'Crea interfaces y experiencias digitales claras, accesibles y utiles.',
    relatedSubjects: ['Diseño visual', 'Investigacion de usuarios', 'Prototipado', 'Usabilidad'],
    commonActivities: ['Prototipar pantallas', 'Entrevistar usuarios', 'Crear sistemas visuales', 'Validar interacciones'],
    requiredSkills: ['creatividad', 'comunicacion', 'pensamiento_critico', 'trabajo_en_equipo'],
    perceivedDifficulty: 'media',
    jobOutcomes: ['Disenador UX/UI', 'Product designer', 'Investigador UX junior', 'Disenador de interfaces'],
    profileMatchReasons: [
      'Encaja con perfiles creativos que tambien quieren trabajar con tecnologia.',
      'Valora comunicacion, empatia y pensamiento critico.'
    ],
    vocationalWeights: {
      areas: { ciencia: 10, tecnologia: 24, ingenieria: 6, arte: 46, matematicas: 14 },
      skills: {
        pensamiento_logico: 8,
        creatividad: 34,
        comunicacion: 28,
        resolucion_de_problemas: 12,
        trabajo_en_equipo: 18,
        pensamiento_critico: 14
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-mechatronics',
    slug: 'ingenieria-mecatronica',
    name: 'Ingeniería Mecatrónica',
    primaryArea: 'ingenieria',
    secondaryAreas: ['tecnologia', 'matematicas'],
    shortDescription: 'Integra mecanica, electronica, programacion y control para crear sistemas inteligentes.',
    relatedSubjects: ['Fisica', 'Robotica', 'Electronica', 'Control automatico'],
    commonActivities: ['Armar prototipos', 'Programar sensores', 'Diagnosticar fallas', 'Automatizar procesos'],
    requiredSkills: ['pensamiento_logico', 'resolucion_de_problemas', 'trabajo_en_equipo', 'analisis_de_datos'],
    perceivedDifficulty: 'alta',
    jobOutcomes: ['Ingeniero de automatizacion', 'Tecnico en robotica', 'Integrador de sistemas', 'Ingeniero de mantenimiento'],
    profileMatchReasons: [
      'Encaja con perfiles que disfrutan construir y depurar sistemas fisicos.',
      'Combina ingenieria, tecnologia y matematicas aplicadas.'
    ],
    vocationalWeights: {
      areas: { ciencia: 14, tecnologia: 24, ingenieria: 38, arte: 2, matematicas: 22 },
      skills: {
        pensamiento_logico: 24,
        creatividad: 8,
        comunicacion: 8,
        resolucion_de_problemas: 32,
        trabajo_en_equipo: 18,
        analisis_de_datos: 12
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-environmental-engineering',
    slug: 'ingenieria-ambiental',
    name: 'Ingeniería Ambiental',
    primaryArea: 'ingenieria',
    secondaryAreas: ['ciencia', 'matematicas'],
    shortDescription: 'Disena soluciones para cuidar recursos, reducir contaminacion y mejorar sistemas ambientales.',
    relatedSubjects: ['Ecologia', 'Quimica ambiental', 'Hidrologia', 'Gestion de proyectos'],
    commonActivities: ['Medir impactos', 'Analizar muestras', 'Proponer mitigaciones', 'Coordinar proyectos comunitarios'],
    requiredSkills: ['pensamiento_critico', 'resolucion_de_problemas', 'comunicacion', 'trabajo_en_equipo'],
    perceivedDifficulty: 'media',
    jobOutcomes: ['Consultor ambiental', 'Analista de impacto', 'Gestor de sostenibilidad', 'Supervisor de tratamiento de agua'],
    profileMatchReasons: [
      'Encaja con interes cientifico aplicado a problemas reales.',
      'Requiere comunicar evidencia y coordinar soluciones.'
    ],
    vocationalWeights: {
      areas: { ciencia: 32, tecnologia: 8, ingenieria: 30, arte: 4, matematicas: 26 },
      skills: {
        pensamiento_logico: 14,
        creatividad: 8,
        comunicacion: 18,
        resolucion_de_problemas: 26,
        trabajo_en_equipo: 18,
        analisis_de_datos: 18,
        pensamiento_critico: 24
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-digital-animation',
    slug: 'animacion-digital',
    name: 'Animacion Digital',
    primaryArea: 'arte',
    secondaryAreas: ['tecnologia'],
    shortDescription: 'Crea personajes, movimiento y mundos visuales con herramientas digitales.',
    relatedSubjects: ['Dibujo', 'Modelado 3D', 'Narrativa visual', 'Edicion digital'],
    commonActivities: ['Animar escenas', 'Crear storyboards', 'Modelar assets', 'Resolver problemas visuales'],
    requiredSkills: ['creatividad', 'comunicacion', 'resolucion_de_problemas', 'trabajo_en_equipo'],
    perceivedDifficulty: 'media',
    jobOutcomes: ['Animador 2D/3D', 'Motion designer', 'Artista de videojuegos', 'Editor audiovisual'],
    profileMatchReasons: [
      'Encaja con alta creatividad y preferencia por crear experiencias visuales.',
      'Aprovecha tecnologia sin exigir un perfil matematico dominante.'
    ],
    vocationalWeights: {
      areas: { ciencia: 4, tecnologia: 20, ingenieria: 4, arte: 62, matematicas: 10 },
      skills: {
        pensamiento_logico: 6,
        creatividad: 38,
        comunicacion: 24,
        resolucion_de_problemas: 12,
        trabajo_en_equipo: 16
      }
    },
    dataSource: 'mock'
  },
  {
    id: 'career-industrial-engineering',
    slug: 'ingenieria-industrial',
    name: 'Ingeniería Industrial',
    primaryArea: 'ingenieria',
    secondaryAreas: ['matematicas', 'tecnologia'],
    shortDescription: 'Mejora procesos, operaciones y equipos para hacer sistemas mas eficientes.',
    relatedSubjects: ['Estadistica', 'Logistica', 'Calidad', 'Gestion de operaciones'],
    commonActivities: ['Mapear procesos', 'Analizar tiempos', 'Coordinar equipos', 'Optimizar recursos'],
    requiredSkills: ['resolucion_de_problemas', 'trabajo_en_equipo', 'comunicacion', 'pensamiento_logico'],
    perceivedDifficulty: 'media',
    jobOutcomes: ['Analista de procesos', 'Supervisor de operaciones', 'Especialista de calidad', 'Planner logistico'],
    profileMatchReasons: [
      'Encaja con perfiles que combinan razonamiento, organizacion y trabajo con personas.',
      'Requiere optimizar sistemas mas que especializarse en una sola area.'
    ],
    vocationalWeights: {
      areas: { ciencia: 8, tecnologia: 16, ingenieria: 34, arte: 6, matematicas: 36 },
      skills: {
        pensamiento_logico: 22,
        creatividad: 8,
        comunicacion: 18,
        resolucion_de_problemas: 26,
        trabajo_en_equipo: 26,
        analisis_de_datos: 18
      }
    },
    dataSource: 'mock'
  }
];

export const MOCK_NEARBY_STEAM_UNIVERSITIES: NearbySteamUniversity[] = [
  {
    id: 'mock-uni-utcv',
    name: 'Universidad Tecnologica del Centro de Veracruz',
    location: { lat: 18.8847, lng: -96.9346 },
    address: 'Cuitlahuac, Veracruz',
    city: 'Cuitlahuac',
    state: 'Veracruz',
    country: 'México',
    programs: ['Ingeniería en Software', 'Mecatrónica', 'Procesos Industriales'],
    websiteUrl: 'https://www.utcv.edu.mx',
    rating: 4.6,
    userRatingsTotal: 120,
    dataSource: 'mock',
    distanceKm: 12
  },
  {
    id: 'mock-uni-tecnm-orizaba',
    name: 'Tecnológico Nacional de México Campus Orizaba',
    location: { lat: 18.8515, lng: -97.0996 },
    address: 'Orizaba, Veracruz',
    city: 'Orizaba',
    state: 'Veracruz',
    country: 'México',
    programs: ['Sistemas Computacionales', 'Ingeniería Quimica', 'Ingeniería Industrial'],
    websiteUrl: 'https://orizaba.tecnm.mx',
    rating: 4.5,
    userRatingsTotal: 180,
    dataSource: 'mock',
    distanceKm: 28
  },
  {
    id: 'mock-uni-uv-cordoba',
    name: 'Universidad Veracruzana Region Cordoba-Orizaba',
    location: { lat: 18.8901, lng: -96.9302 },
    address: 'Cordoba, Veracruz',
    city: 'Cordoba',
    state: 'Veracruz',
    country: 'México',
    programs: ['Biologia', 'Arquitectura', 'Administracion con analitica'],
    websiteUrl: 'https://www.uv.mx',
    rating: 4.4,
    userRatingsTotal: 210,
    dataSource: 'mock',
    distanceKm: 8
  }
];

export const MOCK_UNIVERSITY_CAREER_MATCHES: UniversityCareerMatch[] = [
  {
    id: 'mock-match-utcv-software',
    universityId: 'mock-uni-utcv',
    careerId: 'career-software-engineering',
    matchPercentage: 94,
    reasons: ['Oferta directa en software', 'Cercania alta', 'Buen ajuste tecnologico'],
    distanceScore: 92,
    academicFitScore: 96,
    profileFitScore: 94,
    confidence: 'medium',
    dataSource: 'mock'
  },
  {
    id: 'mock-match-tecnm-data',
    universityId: 'mock-uni-tecnm-orizaba',
    careerId: 'career-data-science',
    matchPercentage: 88,
    reasons: ['Base fuerte en sistemas', 'Buena ruta hacia analitica y datos'],
    distanceScore: 78,
    academicFitScore: 90,
    profileFitScore: 92,
    confidence: 'medium',
    dataSource: 'mock'
  },
  {
    id: 'mock-match-uv-biotech',
    universityId: 'mock-uni-uv-cordoba',
    careerId: 'career-biotechnology',
    matchPercentage: 84,
    reasons: ['Programas cercanos a ciencias biologicas', 'Cercania alta'],
    distanceScore: 96,
    academicFitScore: 82,
    profileFitScore: 78,
    confidence: 'low',
    dataSource: 'mock'
  }
];
