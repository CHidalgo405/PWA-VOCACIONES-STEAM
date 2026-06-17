# Documentacion De Integracion Futura Con API

Guia tecnica para migrar a backend las capas locales/mock agregadas a la PWA de orientacion vocacional STEAM. Este documento no cambia contratos actuales; propone endpoints nuevos o extensiones compatibles para produccion.

## Alcance Y Estado Actual

La app ya consume API real para autenticacion, perfil, preguntas/submit/historial del test, calibracion basica, universidades guardadas y Google Places. Las nuevas capas vocacionales se implementaron en frontend como servicios puros, adaptadores, mocks o persistencia local para no romper la API existente.

Base API actual detectada: `environment.apiUrl = https://vocacionessteam-api-production-d44b.up.railway.app/api/v1`.

Endpoints reales actuales relacionados:

- `GET /tests/questions`
- `POST /tests/submit`
- `GET /tests/history`
- `GET /tests/history/:id`
- `GET /tests/latest`
- `PATCH /tests/history/:id`
- `DELETE /tests/history/:id`
- `POST /tests/calibration`
- `GET /users/profile`
- `PUT /users/profile`
- `PUT /users/settings`
- `POST /users/saved-universities`
- `GET /users/saved-universities`
- `DELETE /users/saved-universities/:id`

Claves locales relevantes:

- `test_answers_${userId}`
- `test_questions_${userId}`
- `test_result_${userId}`
- `test_local_result_${userId}`
- `test_feedback_${userId}`
- `test_location_${userId}`
- `steam_calibration_signals_${userId}`
- `steam_completed_simulators`
- `steam_simulator_signals_${userId}`
- `sim_score_${careerId}`

## Principios De Integracion

- Mantener los endpoints actuales mientras se agregan endpoints nuevos versionados.
- No convertir mocks en datos definitivos sin `dataSource`.
- La IA solo explica; no calcula ranking, match ni porcentajes.
- Toda respuesta nueva debe incluir `dataSource: "api" | "local" | "mock"` o equivalente.
- Los campos de confianza deben venir normalizados como `baja | media | alta` para UI.
- Los datos vocacionales, ubicacion y resultados personales requieren autorizacion JWT.
- La eliminacion de historial debe explicar impacto sobre perfil progresivo.

## 1. Datos Locales Del Test Mejorado

**Codigo actual:** `src/app/core/models/vocational-steam.models.ts`, `src/app/core/data/vocational-steam.mock.ts`, `src/app/core/adapters/vocational-question.adapter.ts`.

**Datos que necesita**

- Preguntas con `id`, `order`, `text`, `category`, `measurementType`, `isActive`.
- Opciones con `id`, `letter`, `text`, `areaWeights`, `skillWeights`, `isNeutral`, `scoringPolicy`, `value`.
- Areas: `ciencia`, `tecnologia`, `ingenieria`, `arte`, `matematicas`.
- Habilidades: `pensamiento_logico`, `creatividad`, `comunicacion`, `resolucion_de_problemas`, `trabajo_en_equipo`, `liderazgo`, `analisis_de_datos`, `pensamiento_critico`.

**Datos que produce**

- Catalogo de preguntas vocacionales listo para Algoritmo 1.
- Opciones neutrales tipo `No lo he probado / No estoy seguro`.
- Preguntas API normalizadas cuando el backend viejo solo devuelve `steamTrait`.

**Fuente actual**

- API actual: `GET /tests/questions`, estructura simple (`Question`, `Option`).
- Local/mock: `MOCK_VOCATIONAL_QUESTIONS`.
- Adaptador: agrega categoria, tipo de medicion, pesos y opcion neutral cuando faltan.

**Endpoint sugerido**

`GET /vocational/questions?version=steam-v2&active=true`

**Ejemplo request**

```http
GET /api/v1/vocational/questions?version=steam-v2&active=true
Authorization: Bearer <jwt>
```

**Ejemplo response**

```json
{
  "version": "steam-v2",
  "dataSource": "api",
  "questions": [
    {
      "id": "q-tech-01",
      "order": 1,
      "text": "Cuando algo digital falla, normalmente prefieres...",
      "category": "construccion_tecnologica",
      "measurementType": "estilo_de_pensamiento",
      "isActive": true,
      "options": [
        {
          "id": "q-tech-01-a",
          "letter": "A",
          "text": "Buscar la causa paso a paso hasta entender el error.",
          "areaWeights": { "tecnologia": 4, "matematicas": 1 },
          "skillWeights": { "pensamiento_logico": 3, "resolucion_de_problemas": 2 },
          "scoringPolicy": "weighted",
          "value": 1
        },
        {
          "id": "q-tech-01-neutral",
          "letter": "D",
          "text": "No lo he probado / No estoy seguro.",
          "areaWeights": {},
          "skillWeights": {},
          "isNeutral": true,
          "scoringPolicy": "no_penalty",
          "value": 0
        }
      ]
    }
  ]
}
```

**Riesgos**

- Si el backend envia pesos incompletos, el algoritmo puede producir perfiles demasiado planos.
- Si no se marca `isNeutral`, una respuesta de falta de experiencia podria castigarse por error.
- Existe una diferencia historica entre `arte` local y `artes` en scores API antiguos; conviene normalizar en backend.

**Prioridad:** Alta.

## 2. Resultados Del Algoritmo 1: Areas Fuertes

**Codigo actual:** `src/app/core/algorithms/steam-strength.algorithm.ts`, `LocalVocationalResultService`.

**Datos que necesita**

- Preguntas vocacionales mejoradas.
- Respuestas del usuario (`questionId`, `optionId` o `optionLetter`).
- Contexto: calibraciones completadas, simuladores completados, fuente de datos.

**Datos que produce**

- `areaScores` normalizados 0-100.
- `skillScores` normalizados 0-100.
- Areas rankeadas.
- Habilidades rankeadas.
- Area dominante, secundaria y `primaryCombination`.
- `confidence`: `baja | media | alta`.
- `explanation`.
- `missingSignals`.
- Conteos: respondidas, neutrales y faltantes.

**Fuente actual**

- Local deterministico. No depende de IA.
- Se guarda dentro de `test_local_result_${userId}`.

**Endpoint sugerido**

`POST /vocational/strength-profile`

**Ejemplo request**

```json
{
  "testSessionId": "test-123",
  "questionVersion": "steam-v2",
  "answers": [
    {
      "questionId": "q-tech-01",
      "optionId": "q-tech-01-a",
      "optionLetter": "A",
      "timeSpentMs": 8200
    }
  ],
  "context": {
    "completedCalibrationModules": 1,
    "completedSimulatorCount": 0
  }
}
```

**Ejemplo response**

```json
{
  "id": "strength-789",
  "dataSource": "api",
  "areaScores": {
    "ciencia": 40,
    "tecnologia": 88,
    "ingenieria": 71,
    "arte": 22,
    "matematicas": 76
  },
  "skillScores": {
    "pensamiento_logico": 90,
    "creatividad": 25,
    "comunicacion": 30,
    "resolucion_de_problemas": 84,
    "trabajo_en_equipo": 55,
    "liderazgo": 42,
    "analisis_de_datos": 78,
    "pensamiento_critico": 63
  },
  "dominantArea": { "area": "tecnologia", "label": "Tecnologia", "normalizedScore": 88, "rank": 1 },
  "secondaryArea": { "area": "matematicas", "label": "Matematicas", "normalizedScore": 76, "rank": 2 },
  "primaryCombination": "Tecnologia + Matematicas",
  "confidence": "media",
  "explanation": "Tu perfil muestra alta afinidad por resolver problemas con herramientas digitales y razonamiento logico.",
  "missingSignals": ["Faltan simuladores"],
  "answeredQuestions": 12,
  "neutralAnswers": 2,
  "missingAnswers": 0,
  "generatedAtIso": "2026-06-17T20:00:00.000Z"
}
```

**Riesgos**

- Duplicar calculo en frontend/backend puede generar diferencias si no se versiona el algoritmo.
- Respuestas neutrales deben reducir confianza, no puntaje.
- Actualmente el modelo TypeScript tiene `missingSignals` declarado dos veces; no rompe build, pero conviene limpiarlo en una fase de mantenimiento.

**Prioridad:** Alta.

## 3. Resultados Del Algoritmo 2: Recomendacion De Carreras

**Codigo actual:** `src/app/core/algorithms/career-recommendation.algorithm.ts`, `MOCK_STEAM_CAREER_MATRIX`.

**Datos que necesita**

- Resultado del Algoritmo 1.
- Matriz de carreras con pesos por areas y habilidades.
- `topN`, normalmente 5.

**Datos que produce**

- Top carreras con `compatibilityPercentage`.
- Razones principales.
- Areas coincidentes.
- Areas a fortalecer.
- Advertencia por baja confianza si aplica.

**Fuente actual**

- Local/mock. La matriz de carreras vive en `vocational-steam.mock.ts`.

**Endpoint sugerido**

`POST /vocational/career-recommendations`

**Ejemplo request**

```json
{
  "strengthProfileId": "strength-789",
  "topN": 5,
  "profile": {
    "areaScores": { "ciencia": 40, "tecnologia": 88, "ingenieria": 71, "arte": 22, "matematicas": 76 },
    "skillScores": { "pensamiento_logico": 90, "resolucion_de_problemas": 84, "analisis_de_datos": 78 }
  }
}
```

**Ejemplo response**

```json
{
  "dataSource": "api",
  "profileConfidence": "media",
  "recommendations": [
    {
      "career": {
        "id": "software-engineering",
        "slug": "ingenieria-software",
        "name": "Ingenieria en Software",
        "primaryArea": "tecnologia",
        "secondaryAreas": ["matematicas", "ingenieria"],
        "shortDescription": "Disena y construye soluciones digitales.",
        "relatedSubjects": ["Programacion", "Bases de datos", "Matematicas discretas"],
        "commonActivities": ["Resolver bugs", "Crear aplicaciones", "Modelar sistemas"],
        "requiredSkills": ["pensamiento_logico", "resolucion_de_problemas", "trabajo_en_equipo"],
        "perceivedDifficulty": "alta",
        "jobOutcomes": ["Desarrollo web", "Arquitectura de software", "IA aplicada"]
      },
      "compatibilityPercentage": 84,
      "mainReasons": ["Coincide con Tecnologia y Matematicas.", "Usa pensamiento logico y resolucion de problemas."],
      "matchingAreas": ["tecnologia", "matematicas"],
      "areasToStrengthen": ["comunicacion"],
      "dataSource": "api"
    }
  ]
}
```

**Riesgos**

- Si todas las carreras tienen pesos parecidos, el ranking pierde utilidad.
- Debe evitarse que todas las recomendaciones salgan con 90%+.
- Debe versionarse la matriz de carreras para comparar historicos.

**Prioridad:** Alta.

## 4. Perfil Progresivo

**Codigo actual:** `src/app/core/services/local-vocational-profile-combiner.service.ts`.

**Datos que necesita**

- Resultado inicial local/API.
- Senales de calibracion.
- Senales de simulador.
- Cantidad de tests historicos.

**Datos que produce**

- Nivel: `perfil_inicial`, `perfil_calibrado`, `perfil_validado`, `perfil_avanzado`.
- Puntajes STEAM combinados.
- Habilidades combinadas.
- Recomendaciones actualizadas.
- Confianza actualizada.
- `changeSummary`.
- Comparacion entre inicial y calibrado/validado.

**Fuente actual**

- Local. Se calcula cuando hay `test_local_result_${userId}` mas senales locales de calibracion/simulador.

**Endpoint sugerido**

`GET /vocational/profile/progressive/latest`

`POST /vocational/profile/progressive/recompute`

**Ejemplo request**

```json
{
  "initialResultId": "local-vocational-123",
  "include": {
    "calibrations": true,
    "simulators": true,
    "history": true
  }
}
```

**Ejemplo response**

```json
{
  "id": "progressive-profile-456",
  "level": "perfil_validado",
  "initialResultId": "test-123",
  "confidence": "alta",
  "completedCalibrationModules": 2,
  "completedSimulatorCount": 1,
  "testResultCount": 1,
  "strengthProfile": {
    "primaryCombination": "Tecnologia + Matematicas",
    "areaScores": { "ciencia": 38, "tecnologia": 91, "ingenieria": 76, "arte": 28, "matematicas": 82 }
  },
  "changeSummary": [
    "La calibracion reforzo Tecnologia.",
    "El simulador aumento la confianza del perfil."
  ],
  "comparison": {
    "initialCombination": "Matematicas + Tecnologia",
    "calibratedCombination": "Tecnologia + Matematicas",
    "changedDominantArea": true,
    "areaDeltas": { "tecnologia": 8, "matematicas": 3 }
  },
  "dataSource": "api",
  "generatedAtIso": "2026-06-17T20:00:00.000Z"
}
```

**Riesgos**

- Si se recalcula sin version de algoritmo, el historial puede cambiar retroactivamente.
- Debe quedar claro al usuario que el perfil evoluciona y no reemplaza resultados anteriores sin trazabilidad.

**Prioridad:** Alta.

## 5. Calibraciones

**Codigo actual:** `LocalVocationalCalibrationService`, `vocational-calibration.mock.ts`, `AuthService.submitCalibration`.

**Datos que necesita**

- Modulos: `physical_hobbies`, `digital_consumption`, `everyday_mechanics`, `gaming_habits`, `school_projects`, `teamwork`.
- Estado de modulo: `locked`, `available`, `completed`.
- Tarjetas con pesos por area/habilidad.
- Respuestas: `liked`, `disliked`, `not_tried`.

**Datos que produce**

- `CalibrationModuleSignalResult`.
- Ajustes por area y habilidad.
- `confidenceBoost`.
- Explicacion.
- Estado de modulo actualizado, badges y desbloqueos.

**Fuente actual**

- API actual: `POST /tests/calibration` acepta `{ moduleId, answers }`.
- Local: `not_tried` no se envia a API para evitar que sea interpretado como negativo.
- LocalStorage: `steam_calibration_signals_${userId}`.

**Endpoint sugerido**

`GET /vocational/calibration/modules`

`POST /vocational/calibration/modules/:moduleId/submit`

**Ejemplo request**

```json
{
  "answers": {
    "gh1": "liked",
    "gh2": "not_tried",
    "gh3": "disliked",
    "gh4": "liked"
  },
  "testResultId": "test-123"
}
```

**Ejemplo response**

```json
{
  "id": "calibration-gaming-123",
  "moduleId": "gaming_habits",
  "moduleTitle": "Juegos y videojuegos",
  "areaAdjustments": { "tecnologia": 100, "matematicas": 80, "ingenieria": 40, "ciencia": 0, "arte": 0 },
  "skillAdjustments": { "pensamiento_logico": 100, "resolucion_de_problemas": 80, "trabajo_en_equipo": 60 },
  "answeredCards": 4,
  "positiveSignals": 2,
  "noExperienceAnswers": 1,
  "confidenceBoost": 14,
  "explanation": "Juegos y videojuegos aporta 2 senales para ajustar el perfil con experiencias reales.",
  "updatedModules": [
    { "id": "gaming_habits", "status": "completed" },
    { "id": "digital_consumption", "status": "available" }
  ],
  "dataSource": "api",
  "generatedAtIso": "2026-06-17T20:00:00.000Z"
}
```

**Riesgos**

- El endpoint actual no conserva `not_tried`; produccion debe soportarlo explicitamente.
- Los desbloqueos hoy se simulan en frontend (`completeCalibrationModule`); backend debe ser fuente de verdad.

**Prioridad:** Alta.

## 6. Simuladores

**Codigo actual:** `CareerSimulatorService`, `career-simulator.models.ts`, `local-career-simulators.mock.ts`.

**Datos que necesita**

- Catalogo de simuladores por carrera.
- Pasos: `CONTEXT`, `DATA_ANALYSIS`, `TRADEOFF_DECISION`, `SURPRISE_REVEAL`, `AI_FEEDBACK`, `EMOTIONAL_REFLECTION`.
- Opciones con `vocationalImpact`.
- Decisiones del usuario y tiempos.
- Flags de sesgo: `too_fast`, `linear_pattern_detected`.

**Datos que produce**

- Resultado de feedback `SimulatorFeedbackResponse`.
- Senal vocacional `SimulatorVocationalSignalResult`.
- Simuladores completados.
- Impacto en perfil progresivo.

**Fuente actual**

- Catalogo intenta API y usa fallback local si falla.
- `submitForAIFeedback` devuelve mock local con `delay(3000)`.
- Progreso: `steam_completed_simulators`.
- Senales: `steam_simulator_signals_${userId}`.

**Endpoint sugerido**

`GET /vocational/simulators`

`GET /vocational/simulators/:careerSlug`

`POST /vocational/simulators/:careerSlug/complete`

**Ejemplo request**

```json
{
  "career_slug": "software-engineering",
  "career_name": "Ingenieria de Software",
  "steam_area": "Tecnologia",
  "user_decisions": [
    {
      "step": 2,
      "step_type": "DATA_ANALYSIS",
      "decision_text": "Elegi revisar el patron de errores antes de proponer cambios.",
      "time_spent_seconds": 18,
      "option_chosen_index": 1
    }
  ],
  "avg_response_time_seconds": 21,
  "bias_flags": {
    "linear_pattern_detected": false,
    "too_fast": false
  }
}
```

**Ejemplo response**

```json
{
  "feedback": {
    "reasoning_style": "Analitico y estructurado",
    "steam_affinity_analysis": "Tecnologia: fuerte, Matematicas: moderado",
    "strengths_detected": ["Uso de datos", "Priorizacion de riesgos"],
    "honest_reality_check": "Mostraste comodidad con informacion incompleta.",
    "affinity_score": 85,
    "confidence_level": "high",
    "suggested_next_simulators": ["ciencia-de-datos"]
  },
  "vocationalSignal": {
    "id": "simulator-signal-software-123",
    "careerId": "software-engineering",
    "careerName": "Ingenieria de Software",
    "role": "Desarrollador junior",
    "areaAdjustments": { "tecnologia": 100, "matematicas": 70 },
    "skillAdjustments": { "pensamiento_logico": 90, "resolucion_de_problemas": 85 },
    "competencyScores": { "analisis": 90, "toma_de_decisiones": 80 },
    "profileAlignment": "reinforces",
    "explanation": "Tus decisiones reforzaron tu afinidad con Tecnologia.",
    "confidence": "alta",
    "affinityScore": 85,
    "dataSource": "api",
    "generatedAtIso": "2026-06-17T20:00:00.000Z"
  }
}
```

**Riesgos**

- El feedback IA no debe reemplazar la senal vocacional deterministica.
- Si la sesion se recarga, el resultado del simulador puede perderse porque el estado vive en memoria/localStorage parcial.
- Debe evitarse guardar razonamientos sensibles sin consentimiento claro.

**Prioridad:** Media-alta.

## 7. Universidades Y Planes De Estudio

**Codigo actual:** `UniversityService`, `LocalUniversityRecommendationService`, `UserService`.

**Datos que necesita**

- Universidad: nombre, campus, coordenadas, direccion, tipo publica/privada si existe, sitio oficial.
- Programas/carreras reales por campus.
- Fuente y fecha de verificacion.
- Distancia calculable desde ubicacion del usuario.

**Datos que produce**

- Lista de universidades cercanas.
- Oferta academica validada.
- Datos para match universitario.

**Fuente actual**

- Google Places: nombre, ubicacion, direccion, rating, fotos, `websiteUri`.
- API propia: universidades guardadas basicas.
- Mock temporal: programas para universidades conocidas en `MOCK_NEARBY_STEAM_UNIVERSITIES`.

**Endpoint sugerido**

`GET /universities/nearby?lat=...&lng=...&radiusKm=30`

`GET /universities/:id/programs`

`POST /users/saved-universities` extendido de forma compatible.

**Ejemplo request**

```http
GET /api/v1/universities/nearby?lat=18.846&lng=-97.100&radiusKm=30&includePrograms=true
Authorization: Bearer <jwt>
```

**Ejemplo response**

```json
{
  "dataSource": "api",
  "universities": [
    {
      "id": "uni-001",
      "name": "Universidad Tecnologica del Centro",
      "city": "Cordoba",
      "state": "Veracruz",
      "country": "Mexico",
      "location": { "lat": 18.85, "lng": -97.11 },
      "address": "Direccion oficial",
      "websiteUrl": "https://universidad.example.edu",
      "institutionType": "publica",
      "programs": [
        {
          "id": "program-001",
          "name": "Ingenieria en Software",
          "degreeLevel": "licenciatura",
          "campus": "Cordoba",
          "areas": ["tecnologia", "matematicas"],
          "sourceUrl": "https://universidad.example.edu/software",
          "verifiedAtIso": "2026-06-01T00:00:00.000Z"
        }
      ],
      "distanceKm": 8.4
    }
  ]
}
```

**Riesgos**

- Google Places no garantiza planes de estudio.
- No se deben inventar carreras para universidades reales.
- Programas por campus cambian; se requiere fecha de verificacion.

**Prioridad:** Alta.

## 8. Match Universitario

**Codigo actual:** `university-match.algorithm.ts`, `LocalUniversityRecommendationService`, `ExploreComponent`.

**Datos que necesita**

- Perfil vocacional y confianza.
- Top carreras recomendadas.
- Universidades cercanas con programas reales.
- Distancia y radio seleccionado.

**Datos que produce**

- `matchTotal`.
- `matchVocational`.
- `matchGeographic`.
- `matchAcademic`.
- Carreras compatibles encontradas.
- Areas compatibles.
- Razones y advertencias.

**Fuente actual**

- Local deterministico.
- Ponderacion actual:
  - 45% carreras ofrecidas vs carreras recomendadas.
  - 25% areas STEAM fuertes.
  - 15% distancia.
  - 10% variedad STEAM.
  - 5% confianza del perfil.

**Endpoint sugerido**

`POST /vocational/university-matches`

**Ejemplo request**

```json
{
  "profileId": "progressive-profile-456",
  "radiusKm": 30,
  "userLocation": { "lat": 18.846, "lng": -97.100 },
  "universityIds": ["uni-001", "uni-002"]
}
```

**Ejemplo response**

```json
{
  "dataSource": "api",
  "algorithmVersion": "university-match-v1",
  "matches": [
    {
      "university": { "id": "uni-001", "name": "Universidad Tecnologica del Centro" },
      "distanceKm": 8.4,
      "matchTotal": 78,
      "matchVocational": 82,
      "matchGeographic": 72,
      "matchAcademic": 76,
      "compatibleCareers": ["Ingenieria en Software"],
      "compatibleAreas": ["tecnologia", "matematicas"],
      "reasons": ["Coincide con Ingenieria en Software.", "Esta dentro de un rango geografico favorable."],
      "warnings": [],
      "dataSource": "api"
    }
  ]
}
```

**Riesgos**

- Si faltan programas reales, el match academico debe bajar y mostrar advertencia.
- Si se mezclan mock y API sin etiqueta visible, se puede inducir mala decision.

**Prioridad:** Alta.

## 9. Explicaciones De IA

**Codigo actual:** `UniversityAiExplanationService`.

**Datos que necesita**

- Perfil vocacional.
- Puntajes STEAM.
- Carreras recomendadas por algoritmo.
- Universidad y programas disponibles.
- Match calculado local/API.
- Distancia, confianza y fuente de datos.

**Datos que produce**

- Explicacion personalizada.
- Por que coincide.
- Carrera mas compatible si existe.
- Informacion faltante.
- Siguientes pasos.

**Fuente actual**

- Local/mock. Existe prompt protegido y explicacion local; no hay llamada real a IA para universidades.
- Simulador tiene mock local en `submitForAIFeedback`; `src/api/ia/career-simulator-feedback.ts` existe como serverless IA pero no esta conectado desde Angular.

**Endpoint sugerido**

`POST /ai/university-match-explanation`

**Ejemplo request**

```json
{
  "profile": {
    "primaryCombination": "Tecnologia + Matematicas",
    "confidence": "media",
    "areaScores": { "tecnologia": 88, "matematicas": 76 }
  },
  "match": {
    "universityName": "Universidad Tecnologica del Centro",
    "distanceKm": 8.4,
    "matchTotal": 78,
    "compatibleCareers": ["Ingenieria en Software"],
    "programs": ["Ingenieria en Software", "Mecatronica"],
    "warnings": [],
    "dataSource": "api"
  },
  "rules": {
    "doNotInventCareers": true,
    "doNotChangeMatchPercentage": true,
    "orientationIsNotDefinitive": true
  }
}
```

**Ejemplo response**

```json
{
  "personalizedExplanation": "Esta universidad aparece como opcion relevante porque su oferta reportada incluye Ingenieria en Software, que coincide con tu perfil Tecnologia + Matematicas.",
  "whyItMatches": "El match combina tu afinidad tecnologica, la carrera compatible y la distancia cercana.",
  "mostCompatibleCareer": "Ingenieria en Software",
  "missingInformation": "Valida requisitos, costos, becas y plan oficial antes de decidir.",
  "suggestedNextSteps": [
    "Revisar el sitio oficial.",
    "Confirmar convocatoria vigente.",
    "Comparar con dos universidades mas."
  ],
  "dataSource": "api",
  "model": "server-side-ai"
}
```

**Riesgos**

- La IA puede alucinar si no se le pasan restricciones y datos estructurados.
- No debe recalcular porcentajes.
- No debe presentar orientacion como sentencia definitiva.

**Prioridad:** Media.

## 10. Historial Evolucionado

**Codigo actual:** `HistoryComponent`.

**Datos que necesita**

- Tests API historicos.
- Resultados locales/progresivos.
- Senales de calibracion.
- Senales de simulador.
- Universidades exploradas/guardadas.

**Datos que produce**

- Timeline de eventos.
- Comparacion entre perfil inicial, calibrado y validado.
- Cambios de areas y carreras recomendadas.
- Confianza a lo largo del tiempo.

**Fuente actual**

- API: `GET /tests/history`, `GET /tests/history/:id`.
- Local fallback: `test_local_result_${userId}`, `steam_calibration_signals_${userId}`, `steam_simulator_signals_${userId}`.

**Endpoint sugerido**

`GET /vocational/history/timeline`

`GET /vocational/history/:eventId`

**Ejemplo request**

```http
GET /api/v1/vocational/history/timeline?includeLocalMigrationHints=true
Authorization: Bearer <jwt>
```

**Ejemplo response**

```json
{
  "dataSource": "api",
  "events": [
    {
      "id": "event-test-123",
      "type": "test_completed",
      "title": "Test vocacional completado",
      "dateIso": "2026-06-17T20:00:00.000Z",
      "profileCombination": "Tecnologia + Matematicas",
      "confidence": "media",
      "resultId": "test-123"
    },
    {
      "id": "event-calibration-gh",
      "type": "calibration_completed",
      "title": "Calibracion: Juegos y videojuegos",
      "dateIso": "2026-06-18T18:00:00.000Z",
      "impactSummary": "Refuerzo Tecnologia y pensamiento logico."
    }
  ],
  "snapshots": [
    {
      "level": "perfil_inicial",
      "combination": "Matematicas + Tecnologia",
      "confidence": "media"
    },
    {
      "level": "perfil_calibrado",
      "combination": "Tecnologia + Matematicas",
      "confidence": "media"
    }
  ]
}
```

**Riesgos**

- Eliminar tests puede afectar perfiles progresivos si no se conserva snapshot.
- Eventos locales en un dispositivo no existen en otro hasta migrarlos a backend.

**Prioridad:** Media-alta.

## 11. Reporte Exportable

**Codigo actual:** `PdfReportTemplateComponent`, `TestResultComponent`.

**Datos que necesita**

- Nombre de usuario.
- Fecha.
- Perfil dominante y area secundaria.
- Puntajes ADN STEAM.
- Confianza y explicacion.
- Top carreras.
- Universidades recomendadas si existen.
- Simuladores y calibraciones completadas.
- Proximos pasos.
- Nota responsable.

**Datos que produce**

- Reporte visual en frontend.
- Descarga PDF con `html2canvas`/`jsPDF`.

**Fuente actual**

- Local en frontend. Combina API del test con resultados locales experimentales.
- No hay endpoint de reporte server-side.

**Endpoint sugerido**

`GET /vocational/reports/latest`

`POST /vocational/reports`

Opcional para PDF server-side:

`GET /vocational/reports/:id.pdf`

**Ejemplo request**

```json
{
  "profileId": "progressive-profile-456",
  "includeUniversities": true,
  "includeLocalData": false,
  "audience": "tutor_orientador"
}
```

**Ejemplo response**

```json
{
  "id": "report-123",
  "studentName": "Usuario STEAM",
  "createdAtIso": "2026-06-17T20:00:00.000Z",
  "dominantProfile": "Tecnologia + Matematicas",
  "secondaryArea": "Ingenieria",
  "steamScores": { "ciencia": 38, "tecnologia": 91, "ingenieria": 76, "arte": 28, "matematicas": 82 },
  "confidence": "alta",
  "resultExplanation": "Tu perfil combina solucion digital de problemas con razonamiento cuantitativo.",
  "careerRecommendations": [
    { "name": "Ingenieria en Software", "compatibilityPercentage": 84, "reason": "Coincide con Tecnologia y pensamiento logico." }
  ],
  "universityRecommendations": [
    { "name": "Universidad Tecnologica del Centro", "matchPercentage": 78, "dataSource": "api" }
  ],
  "completedSimulators": ["software-engineering"],
  "completedCalibrations": ["gaming_habits", "physical_hobbies"],
  "nextSteps": [
    "Validar planes oficiales.",
    "Completar un simulador adicional."
  ],
  "responsibleNote": "Este reporte orienta; no decide por el usuario.",
  "downloadUrl": "/api/v1/vocational/reports/report-123.pdf"
}
```

**Riesgos**

- No incluir datos mock como definitivos.
- PDF frontend puede variar visualmente segun navegador.
- Reportes compartibles deben cuidar privacidad y caducidad de enlaces.

**Prioridad:** Media.

## Plan De Migracion Recomendado

1. **Fase 1: Versionar modelos vocacionales**
   - Agregar `GET /vocational/questions`.
   - Agregar matriz de carreras en backend.
   - Mantener adaptador frontend como fallback.

2. **Fase 2: Mover calculos deterministas**
   - Implementar `POST /vocational/strength-profile`.
   - Implementar `POST /vocational/career-recommendations`.
   - Guardar `algorithmVersion`.

3. **Fase 3: Persistir perfil progresivo**
   - Implementar senales de calibracion y simulador.
   - Implementar recomputo de perfil progresivo.
   - Migrar `steam_calibration_signals_${userId}` y `steam_simulator_signals_${userId}` si se desea conservar datos locales.

4. **Fase 4: Universidades reales**
   - Crear base academica por campus/programa.
   - Conectar match universitario con datos verificados.
   - Mantener Google Places solo para ubicacion/metadatos, no para planes de estudio.

5. **Fase 5: IA explicativa**
   - Conectar endpoint server-side con prompt protegido.
   - Registrar fuente, modelo y restricciones.
   - Auditar respuestas para evitar alucinaciones.

6. **Fase 6: Historial y reportes**
   - Persistir timeline evolucionado.
   - Generar reportes reproducibles con snapshot de datos.
   - Definir politica de privacidad y expiracion para PDFs.

## Que Falta Para Quedar 100% Conectado A Backend

- Preguntas STEAM v2 con pesos por area y habilidades desde API.
- Matriz de carreras STEAM persistida y versionada.
- Calculo backend del Algoritmo 1.
- Calculo backend del Algoritmo 2.
- Persistencia de resultado local experimental como resultado oficial o secundario.
- Calibraciones con soporte para `not_tried`.
- Senales de simulador persistidas por usuario.
- Perfil progresivo calculado y almacenado server-side.
- Base de universidades con planes reales por campus.
- Match universitario backend con advertencias de datos insuficientes.
- Endpoint IA server-side para explicaciones, sin cambiar porcentajes.
- Timeline evolucionado unificado.
- Reporte exportable server-side o snapshot persistido para reproducibilidad.

## Riesgos Globales

- **Divergencia frontend/backend:** si ambos calculan algoritmos sin version compartida.
- **Privacidad:** ubicacion, historial vocacional y reportes son datos sensibles.
- **Datos academicos incompletos:** Google Places no sustituye planes de estudio.
- **IA:** solo debe explicar datos calculados, no inventar ni decidir.
- **Historial:** recalcular sin snapshots puede cambiar resultados antiguos.
- **Mock en produccion:** toda oferta mock debe seguir marcada como `mock` hasta validacion.

