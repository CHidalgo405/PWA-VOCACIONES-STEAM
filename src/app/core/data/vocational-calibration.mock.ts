import type {
  CalibrationExperienceModule,
  CalibrationExperienceModuleId,
  CalibrationModuleStatus
} from '../models/vocational-steam.models';

export const LOCAL_CALIBRATION_MODULES: CalibrationExperienceModule[] = [
  {
    id: 'physical_hobbies',
    title: 'Hobbies',
    shortTitle: 'Hobbies',
    subtitle: 'Actividades que ya haces fuera de la escuela.',
    description: 'Identifica señales vocacionales en intereses reales, manuales, creativos o de exploración.',
    icon: 'leaf',
    order: 1,
    defaultStatus: 'available',
    unlockExplanation: 'Disponible después de completar el test vocacional.',
    lockedReason: 'Completa primero el test vocacional para iniciar esta calibración.',
    dataSource: 'local',
    cards: [
      {
        id: 'ph1',
        text: 'Cuidar plantas, mascotas o observar cómo cambia un ecosistema.',
        category: 'ciencia',
        areaWeights: { ciencia: 4 },
        skillWeights: { pensamiento_critico: 2, analisis_de_datos: 1 }
      },
      {
        id: 'ph2',
        text: 'Armar, reparar o adaptar objetos físicos con tus manos.',
        category: 'ingenieria',
        areaWeights: { ingenieria: 4, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 }
      },
      {
        id: 'ph3',
        text: 'Crear dibujos, música, manualidades, videos o piezas visuales.',
        category: 'arte',
        areaWeights: { arte: 4 },
        skillWeights: { creatividad: 3, comunicacion: 1 }
      },
      {
        id: 'ph4',
        text: 'Resolver rompecabezas, ajedrez, sudoku o retos numéricos.',
        category: 'matematicas',
        areaWeights: { matematicas: 4 },
        skillWeights: { pensamiento_logico: 3, analisis_de_datos: 1 }
      }
    ]
  },
  {
    id: 'gaming_habits',
    title: 'Juegos y videojuegos',
    shortTitle: 'Juegos',
    subtitle: 'Decisiones, estrategias y retos que aparecen cuando juegas.',
    description: 'Traduce hábitos de juego en señales de estrategia, lógica, creatividad y colaboración.',
    icon: 'gamepad-2',
    order: 2,
    defaultStatus: 'available',
    unlockExplanation: 'Disponible después de completar el test vocacional.',
    lockedReason: 'Completa primero el test vocacional para desbloquear este módulo.',
    dataSource: 'local',
    cards: [
      {
        id: 'gh1',
        text: 'Planear estrategias en equipo para ganar una partida o misión.',
        category: 'habilidades',
        areaWeights: { ingenieria: 2, tecnologia: 1 },
        skillWeights: { trabajo_en_equipo: 3, liderazgo: 1, pensamiento_critico: 1 }
      },
      {
        id: 'gh2',
        text: 'Analizar sistemas, reglas o bugs para entender cómo funciona un juego.',
        category: 'tecnologia',
        areaWeights: { tecnologia: 4, matematicas: 1 },
        skillWeights: { pensamiento_logico: 3, resolucion_de_problemas: 2 }
      },
      {
        id: 'gh3',
        text: 'Diseñar personajes, mundos, mapas, historias o elementos visuales.',
        category: 'arte',
        areaWeights: { arte: 4, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 1 }
      },
      {
        id: 'gh4',
        text: 'Calcular estadísticas, probabilidades o mejoras para optimizar decisiones.',
        category: 'matematicas',
        areaWeights: { matematicas: 4, tecnologia: 1 },
        skillWeights: { analisis_de_datos: 2, pensamiento_logico: 2 }
      }
    ]
  },
  {
    id: 'digital_consumption',
    title: 'Consumo digital',
    shortTitle: 'Consumo digital',
    subtitle: 'Contenido que consumes y exploras por iniciativa propia.',
    description: 'Detecta patrones vocacionales en tutoriales, canales, comunidades y temas digitales.',
    icon: 'monitor-smartphone',
    order: 3,
    defaultStatus: 'locked',
    unlockExplanation: 'Se desbloquea al completar Hobbies o Juegos/videojuegos.',
    lockedReason: 'Completa Hobbies o Juegos/videojuegos para desbloquear este módulo.',
    dataSource: 'local',
    cards: [
      {
        id: 'dc1',
        text: 'Ver documentales o canales sobre ciencia, salud, ambiente o astronomía.',
        category: 'ciencia',
        areaWeights: { ciencia: 4 },
        skillWeights: { pensamiento_critico: 2, analisis_de_datos: 1 }
      },
      {
        id: 'dc2',
        text: 'Seguir tutoriales de programación, automatización, IA o herramientas digitales.',
        category: 'tecnologia',
        areaWeights: { tecnologia: 4 },
        skillWeights: { pensamiento_logico: 2, resolucion_de_problemas: 2 }
      },
      {
        id: 'dc3',
        text: 'Consumir análisis de diseño, animación, fotografía, música o producción visual.',
        category: 'arte',
        areaWeights: { arte: 4, tecnologia: 1 },
        skillWeights: { creatividad: 3, comunicacion: 1 }
      },
      {
        id: 'dc4',
        text: 'Leer explicaciones sobre datos, economía, criptografía o teoría de juegos.',
        category: 'matematicas',
        areaWeights: { matematicas: 3, tecnologia: 1 },
        skillWeights: { analisis_de_datos: 3, pensamiento_logico: 1 }
      }
    ]
  },
  {
    id: 'everyday_mechanics',
    title: 'Resolución de problemas cotidianos',
    shortTitle: 'Problemas cotidianos',
    subtitle: 'Cómo resuelves retos prácticos en casa, escuela o comunidad.',
    description: 'Observa competencias que aparecen cuando algo falla, falta organización o hay que mejorar un proceso.',
    icon: 'wrench',
    order: 4,
    defaultStatus: 'locked',
    unlockExplanation: 'Se desbloquea al completar Hobbies.',
    lockedReason: 'Completa Hobbies para desbloquear este módulo.',
    dataSource: 'local',
    cards: [
      {
        id: 'em1',
        text: 'Reparar, diagnosticar o mejorar un objeto, aparato o conexión.',
        category: 'ingenieria',
        areaWeights: { ingenieria: 4, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 3, pensamiento_logico: 1 }
      },
      {
        id: 'em2',
        text: 'Organizar gastos, tiempos, rutas o recursos para hacer algo más eficiente.',
        category: 'matematicas',
        areaWeights: { matematicas: 3, ingenieria: 1 },
        skillWeights: { analisis_de_datos: 2, pensamiento_logico: 2 }
      },
      {
        id: 'em3',
        text: 'Explicar a otras personas cómo resolver un problema paso a paso.',
        category: 'habilidades',
        areaWeights: { ingenieria: 1 },
        skillWeights: { comunicacion: 3, trabajo_en_equipo: 1 }
      },
      {
        id: 'em4',
        text: 'Probar varias soluciones aunque la primera no funcione.',
        category: 'habilidades',
        areaWeights: { ingenieria: 2, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 2, pensamiento_critico: 2 }
      }
    ]
  },
  {
    id: 'school_projects',
    title: 'Proyectos escolares',
    shortTitle: 'Proyectos',
    subtitle: 'Experiencias en tareas, exposiciones, ferias, prototipos o investigaciones.',
    description: 'Usa proyectos reales para detectar áreas donde ya has aplicado habilidades STEAM.',
    icon: 'notebook-tabs',
    order: 5,
    defaultStatus: 'locked',
    unlockExplanation: 'Se desbloquea al completar Consumo digital o Resolución de problemas cotidianos.',
    lockedReason: 'Completa Consumo digital o Resolución de problemas cotidianos para desbloquear este módulo.',
    dataSource: 'local',
    cards: [
      {
        id: 'sp1',
        text: 'Investigar, comprobar fuentes y presentar evidencia en un proyecto.',
        category: 'ciencia',
        areaWeights: { ciencia: 3, matematicas: 1 },
        skillWeights: { pensamiento_critico: 3, comunicacion: 1 }
      },
      {
        id: 'sp2',
        text: 'Crear una maqueta, prototipo, experimento o solución técnica.',
        category: 'ingenieria',
        areaWeights: { ingenieria: 4, tecnologia: 1 },
        skillWeights: { resolucion_de_problemas: 3, creatividad: 1 }
      },
      {
        id: 'sp3',
        text: 'Analizar datos, hacer gráficas o justificar conclusiones con números.',
        category: 'matematicas',
        areaWeights: { matematicas: 4, ciencia: 1 },
        skillWeights: { analisis_de_datos: 3, pensamiento_logico: 1 }
      },
      {
        id: 'sp4',
        text: 'Diseñar la presentación, historia visual o materiales para comunicar mejor.',
        category: 'arte',
        areaWeights: { arte: 4 },
        skillWeights: { creatividad: 2, comunicacion: 2 }
      }
    ]
  },
  {
    id: 'teamwork',
    title: 'Trabajo en equipo',
    shortTitle: 'Equipo',
    subtitle: 'Cómo colaboras, comunicas y tomas rol dentro de un grupo.',
    description: 'Aporta señales sobre comunicación, liderazgo, responsabilidad compartida y resolución colaborativa.',
    icon: 'users',
    order: 6,
    defaultStatus: 'locked',
    unlockExplanation: 'Se desbloquea al completar Proyectos escolares.',
    lockedReason: 'Completa Proyectos escolares para desbloquear este módulo.',
    dataSource: 'local',
    cards: [
      {
        id: 'tw1',
        text: 'Coordinar tareas para que cada integrante sepa qué hacer.',
        category: 'habilidades',
        areaWeights: { ingenieria: 1 },
        skillWeights: { liderazgo: 3, trabajo_en_equipo: 2 }
      },
      {
        id: 'tw2',
        text: 'Escuchar ideas distintas y convertirlas en una solución común.',
        category: 'habilidades',
        areaWeights: { arte: 1, ingenieria: 1 },
        skillWeights: { comunicacion: 3, pensamiento_critico: 1, trabajo_en_equipo: 2 }
      },
      {
        id: 'tw3',
        text: 'Resolver desacuerdos con argumentos y evidencia.',
        category: 'habilidades',
        areaWeights: { ciencia: 1, matematicas: 1 },
        skillWeights: { pensamiento_critico: 2, comunicacion: 2 }
      },
      {
        id: 'tw4',
        text: 'Ayudar a mejorar una idea aunque no sea la tuya.',
        category: 'habilidades',
        areaWeights: { arte: 1 },
        skillWeights: { trabajo_en_equipo: 3, creatividad: 1 }
      }
    ]
  }
];

export const DEFAULT_CALIBRATION_MODULE_STATES: Record<CalibrationExperienceModuleId, CalibrationModuleStatus> =
  LOCAL_CALIBRATION_MODULES.reduce((states, module) => {
    states[module.id] = module.defaultStatus;
    return states;
  }, {} as Record<CalibrationExperienceModuleId, CalibrationModuleStatus>);
