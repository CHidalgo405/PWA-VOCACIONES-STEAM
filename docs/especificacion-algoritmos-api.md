# Especificación de Algoritmos — Motor Vocacional STEAM

> **Para:** Equipo de Backend / API
> **De:** Equipo Frontend (PWA Angular)
> **Objetivo:** Migrar al backend los algoritmos que hoy corren localmente en el cliente, manteniendo **exactamente** el mismo contrato de entrada/salida.

---

## 0. Filosofía y reglas de oro

1. **Local-first replicable.** El frontend ya ejecuta todos estos algoritmos localmente en `vocational-profile.service.ts` y `career-simulator.service.ts`. La API debe replicar la **misma fórmula** para que el resultado sea idéntico. Cuando la API esté lista, el front solo cambia el origen de los datos (de `localStorage` a HTTP), sin tocar la forma de la respuesta.

2. **Determinismo en el núcleo.** Mismo input → mismo output, siempre. **NO se usa IA** para construir el perfil ni para puntuar afinidades. La IA se reserva **únicamente** para el matching de universidades (Algoritmo 8), porque ahí sí hay ambigüedad lingüística real.

3. **El contrato de tipos ya existe.** Está en `src/app/core/models/vocational-profile.models.ts`. Ese archivo es la **fuente de verdad** de la forma de los datos. Este documento explica *cómo* calcular cada campo.

4. **Trazabilidad.** Cada perfil guarda las `contributions` que lo formaron (qué fuente, qué peso, qué vector aportó). Esto permite auditar el cálculo y mostrarlo al usuario.

---

## 1. Resumen ejecutivo: ¿cuántos algoritmos?

**8 algoritmos en total**, organizados en 2 fases:

### Fase A — Construcción del perfil (vector STEAM)

| # | Algoritmo | Tipo | Entrada | Salida |
|---|-----------|------|---------|--------|
| **A1** | Vector teórico | Determinista | 20 respuestas del test | Vector STEAM base (0-100) |
| **A2** | Vector de calibración | Determinista | Swipes (like/dislike) de los módulos | Vector STEAM parcial |
| **A3** | Vector de simulador | Determinista | Decisiones en simuladores | Afinidad por eje + score global |
| **A4** | Fusión ponderada | Determinista | A1 + A2 + A3 | Vector STEAM final calibrado |
| **A5** | Medidor de calibración | Determinista | Nº de módulos y simuladores hechos | Nivel 0-100 + confianza |

### Fase B — Recomendaciones (sobre el perfil)

| # | Algoritmo | Tipo | Entrada | Salida |
|---|-----------|------|---------|--------|
| **A6** | Vocaciones predominantes | Determinista | Vector final + ejes dominantes | Top 4 vocaciones con afinidad |
| **A7** | Carreras / planes de estudio | Determinista | Vector final + ejes dominantes | Top 5 carreras con afinidad |
| **A8** | Matching de universidades | **IA + Datos** | Carreras A7 + universidades cercanas + filtros | Universidades con % de match y explicación |

> **Nota:** La narrativa del perfil (nombre, arquetipo, resumen, fortalezas, próximos pasos) **no** es un algoritmo aparte: son **plantillas deterministas** que se rellenan a partir de los ejes dominantes. Se detallan en la sección 7.

---

## 2. Modelo de datos compartido

### Los 5 ejes STEAM (claves normalizadas, sin acentos)

```
ciencia | tecnologia | ingenieria | artes | matematicas
```

### Vector STEAM

Objeto con los 5 ejes, cada valor entero **0-100**:

```json
{ "ciencia": 72, "tecnologia": 88, "ingenieria": 60, "artes": 35, "matematicas": 80 }
```

### Pesos globales de cada fuente (CONSTANTES — no cambiar sin versionar)

```
theoretical (test teórico)      → 0.55   (55%)  ← CIMIENTO
calibration (tests de swipe)    → 0.30   (30%)  ← CORRECCIÓN DE SESGO
simulator   (simuladores)       → 0.15   (15%)  ← BAÑO DE REALIDAD
```

### Ganancias del medidor de calibración

```
theoreticalBase        = 55   (completar el test teórico fija la base)
perCalibrationModule   = 10   (cada módulo de swipe completado)
perSimulator           =  7   (cada simulador completado)
```

---

## 3. Pipeline general

```
                 ┌─────────────────┐
  Test teórico → │ A1  Vector base │ ──┐
                 └─────────────────┘   │
                 ┌─────────────────┐   │   ┌──────────────────┐
  Calibración  → │ A2  Vector cal. │ ──┼─→ │ A4  Fusión 55/30/15│ → Vector FINAL
                 └─────────────────┘   │   └──────────────────┘        │
                 ┌─────────────────┐   │                               │
  Simuladores  → │ A3  Vector sim. │ ──┘                               │
                 └─────────────────┘                                   │
                                                                       ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  A5 Medidor de calibración   +   Narrativa/Fortalezas (plantillas)        │
   │  A6 Vocaciones predominantes (Top 4)                                       │
   │  A7 Carreras / planes de estudio (Top 5)                                   │
   └──────────────────────────────────────────────────────────────────────────┘
                                                                       │
                                              Carreras A7 + Ubicación  ▼
                                            ┌──────────────────────────────────┐
                                            │ A8  Matching universidades (IA)   │
                                            └──────────────────────────────────┘
```

---

## 4. FASE A — Construcción del perfil

### A1 — Vector teórico (test de 20 preguntas)

**Propósito:** convertir las respuestas del test teórico en el vector STEAM base. Es el **55%** del perfil.

**Entrada:**
- Cada pregunta tiene 4-5 opciones; cada opción está etiquetada con **un** eje STEAM (`steamTrait`).
- Al responder, se suma **+1** al eje de la opción elegida.
- Resultado: un conteo crudo por eje, p. ej. `{ ciencia: 4, tecnologia: 7, ingenieria: 3, artes: 2, matematicas: 4 }` (suma = 20).

**Paso a paso:**
1. Tomar el conteo crudo por eje.
2. Hallar el máximo: `max = max(1, conteo de cada eje)`.
3. Normalizar cada eje a 0-100 **relativo al máximo**:
   ```
   vector[eje] = round( (conteo[eje] / max) * 100 )
   ```
   → El eje más elegido queda en 100; los demás, proporcionales.

**Salida (ejemplo):**
```json
{ "ciencia": 57, "tecnologia": 100, "ingenieria": 43, "artes": 29, "matematicas": 57 }
```

**Casos borde:** si todos los conteos son 0 (no debería pasar), `max=1` evita división por cero y el vector queda en 0.

---

### A2 — Vector de calibración (módulos de swipe)

**Propósito:** corregir el sesgo del test teórico con evidencia "experiencial" (lo que el usuario realmente disfruta/ha hecho). Es el **30%** del perfil.

**Entrada:** lista de módulos completados. Cada módulo trae cartas, y cada carta pertenece a un eje y fue marcada `liked` o `disliked`:
```json
{
  "moduleId": "gaming_habits",
  "answers": [
    { "axis": "ingenieria", "liked": true },
    { "axis": "tecnologia", "liked": false },
    ...
  ]
}
```

**Paso a paso:**
1. Acumular por eje cuántos `liked` y cuántos `disliked` recibió.
2. Para cada eje **que tenga al menos una señal**, partir de un neutral de 50 y ajustar:
   ```
   vector[eje] = clamp( 50 + (liked * 15) - (disliked * 8) )
   ```
   - `liked` pesa más (+15) que el castigo del `disliked` (−8): premiamos el interés demostrado.
   - `clamp` acota a 0-100.
3. **Si un eje no recibió ninguna carta, se omite** (queda `undefined`, no entra a la fusión por ese eje).

**Salida (parcial — solo ejes con señal):**
```json
{ "ingenieria": 80, "tecnologia": 42, "matematicas": 65 }
```

---

### A3 — Vector de simulador (baño de realidad)

**Propósito:** medir la afinidad real observando **decisiones**, no respuestas declarativas. Es el **15%** del perfil. Tiene **dos partes**: (A3a) calcular la afinidad de UN simulador, y (A3b) agregar varios simuladores al vector.

#### A3a — Afinidad de un simulador

**Entrada:** la sesión del simulador, con las decisiones del usuario. Cada opción elegida trae un `steamTraitWeight` (cuánto aporta a cada eje):
```json
{
  "steamTraitWeight": { "ciencia": 8, "tecnologia": 2, "ingenieria": 0, "artes": 0, "matematicas": 5 }
}
```
Además: tiempo por decisión y banderas de sesgo (`too_fast`, `linear_pattern_detected`).

**Paso a paso:**
1. **Acumular** los `steamTraitWeight` de todas las opciones elegidas, por eje.
   - Si una opción no trae `steamTraitWeight` pero sí un `steamArea` (S/T/E/A/M), sumar +10 a ese eje.
2. **Normalizar** a 0-100 relativo al eje con mayor acumulación (igual que A1).
3. **Score de afinidad con la carrera** (eje principal de la carrera simulada):
   ```
   primaryScore = steamScores[ejePrincipalDeLaCarrera]   (o 60 si no hubo decisiones puntuables)

   timeFactor    = min(1, tiempoPromedioSeg / 20)      ← premia reflexión
   biasDeduction = 15 si linear_pattern_detected, si no 0
   speedDeduction= 10 si too_fast, si no 0

   affinity_score = clamp(
       round( primaryScore * (0.7 + 0.3 * timeFactor) - biasDeduction - speedDeduction ),
       10, 100
   )
   ```
4. **Nivel de confianza:**
   ```
   too_fast Y linear   → 'low'
   too_fast O linear   → 'medium'
   ninguno             → 'high'
   ```

**Salida:** un `SimulatorAffinityResult`:
```json
{
  "careerSlug": "software",
  "axis": "tecnologia",
  "affinity": 82,
  "biasFlags": { "too_fast": false, "linear_pattern_detected": false }
}
```

#### A3b — Agregación al vector del perfil

**Entrada:** todos los `SimulatorAffinityResult` del usuario.

**Paso a paso:** para cada eje, **promediar** las afinidades de los simuladores que apunten a ese eje:
```
vector[eje] = round( promedio de affinity de los simuladores cuyo axis = eje )
```
Ejes sin simulador se omiten (igual que A2).

**Salida (parcial):** `{ "tecnologia": 82, "matematicas": 74 }`

---

### A4 — Fusión ponderada (el corazón del motor)

**Propósito:** combinar A1 + A2 + A3 en el vector STEAM final, **renormalizando los pesos** según qué fuentes tengan señal en cada eje.

**Regla clave:** el test teórico (A1) **siempre** aporta a todos los ejes. Calibración y simulador aportan **solo a los ejes donde tengan señal**. Por eso los pesos se renormalizan **por eje**.

**Paso a paso (para cada eje):**
```
partes = [ { peso: 0.55, valor: A1[eje] } ]                 ← siempre

si A2 tiene el eje:  partes.push({ peso: 0.30, valor: A2[eje] })
si A3 tiene el eje:  partes.push({ peso: 0.15, valor: A3[eje] })

pesoTotal = suma de los pesos presentes
vectorFinal[eje] = round( Σ(peso * valor) / pesoTotal )
```

**Ejemplo para el eje `tecnologia`:**
- A1 = 100, A2 = 42, A3 = 82
- `(0.55*100 + 0.30*42 + 0.15*82) / (0.55+0.30+0.15)` = `(55 + 12.6 + 12.3) / 1.0` = **80**

**Ejemplo para `artes`** (sin calibración ni simulador):
- Solo A1 = 29 → `(0.55*29) / 0.55` = **29** (el peso se renormaliza solo, no se "diluye").

**Salida:** el `SteamVector` final 0-100. De aquí salen los **ejes dominantes** = ordenar de mayor a menor.

---

### A5 — Medidor de calibración y confianza

**Propósito:** un medidor 0-100 que comunica **cuánta evidencia** respalda el perfil (a más tests, más confiable).

**Paso a paso:**
```
level = clamp(
    55                              (base por hacer el test teórico)
  + modulosCompletados * 10
  + simuladoresCompletados * 7
)

confianza:
  level >= 90  → 'altamente_calibrado'
  level >= 75  → 'calibrado'
  level >= 60  → 'en_calibracion'
  else         → 'inicial'
```

**Salida:**
```json
{
  "level": 82,
  "confidence": "calibrado",
  "calibrationModulesCompleted": 3,
  "simulatorsCompleted": 1,
  "explanation": "Buen nivel de calibración. Completa algún simulador más para afinar al máximo tu perfil."
}
```

---

## 5. FASE B — Recomendaciones

### A6 — Vocaciones predominantes (Top 4)

**Propósito:** sugerir **áreas de actividad profesional** (más amplias que una carrera) a partir de los ejes dominantes.

**Entrada:** vector final + ejes dominantes + un **catálogo de vocaciones por eje** (administrado por la API; ver sección 8).

**Paso a paso:**
1. Tomar los **3 ejes dominantes**.
2. Para cada eje, recorrer su catálogo de vocaciones y asignar una afinidad:
   ```
   affinity = clamp( round( scoreDelEje * 0.85 + 12 ) )
   ```
   (El `+12` evita afinidades artificialmente bajas; el `*0.85` deja margen para diferenciar.)
3. Ordenar todas por afinidad descendente y **tomar las primeras 4**.

**Salida (array de `VocationRecommendation`):**
```json
[
  {
    "name": "Desarrollo de software",
    "axis": "tecnologia",
    "affinity": 80,
    "description": "Diseñar y construir aplicaciones y sistemas que resuelven problemas reales.",
    "skills": ["Programación", "Lógica", "Arquitectura de sistemas"],
    "icon": "code-2"
  }
]
```

---

### A7 — Carreras / planes de estudio (Top 5)

**Propósito:** sugerir **carreras concretas** (con plan de estudios y campos laborales) a partir de los ejes dominantes.

**Entrada:** vector final + ejes dominantes + un **catálogo de carreras por eje** (sección 8).

**Paso a paso:** idéntico a A6, pero:
- Misma fórmula de afinidad: `clamp(round(scoreDelEje * 0.85 + 12))`.
- Se genera un `rationale` (por qué encaja) a partir del eje.
- Ordenar por afinidad y **tomar las primeras 5**.

**Salida (array de `CareerRecommendation`):**
```json
[
  {
    "careerName": "Ingeniería en Software",
    "axis": "tecnologia",
    "affinity": 80,
    "rationale": "Encaja con tu fuerte afinidad en Tecnología: aprendes herramientas nuevas con facilidad...",
    "studyPlanHighlights": ["Algoritmos", "Estructuras de datos", "Bases de datos"],
    "careerFields": ["Desarrollo web/móvil", "Startups", "Cloud"],
    "relatedSimulatorSlug": "software",
    "icon": "code-2"
  }
]
```

---

## 6. FASE B (IA) — A8: Matching de universidades

> Ver sección 9 para el diseño detallado y mi recomendación. Resumen del contrato aquí.

**Propósito:** dadas las carreras recomendadas (A7) y las universidades cercanas, devolver una lista rankeada con **% de match** y **explicación**, filtrable por distancia y costo.

**Entrada:**
```json
{
  "recommendedCareers": [ /* salida de A7 */ ],
  "userLocation": { "lat": 19.43, "lng": -99.13 },
  "filters": {
    "maxDistanceKm": 50,           // 10 | 25 | 50 | 100
    "costPreference": "any"        // "public" | "affordable" | "any"
  },
  "nearbyUniversities": [ /* de la BD + Google Maps */ ]
}
```

**Salida:**
```json
{
  "matches": [
    {
      "universityId": "uuid",
      "name": "Universidad X",
      "matchedCareer": "Ingeniería en Software",
      "matchScore": 88,
      "distanceKm": 12.4,
      "costTier": "public",
      "explanation": "Ofrece exactamente el programa recomendado, es pública...",
      "websiteUrl": "...",
      "googleMapsData": { "rating": 4.5, "address": "..." }
    }
  ],
  "generatedAt": "ISO"
}
```

---

## 7. Derivados deterministas (plantillas, no algoritmos)

Estos campos del perfil se rellenan con **plantillas** según los ejes dominantes. No requieren cómputo complejo:

- **`profileName`**: `"Perfil " + adjetivo(eje1)`. Si el eje 2 está a ≤15 pts del eje 1 → híbrido: `"Perfil Tecnológico–Matemático"`.
- **`profileArchetype`**: arquetipo del eje dominante (ej. "Creador Digital").
- **`profileSummary`**: párrafo armado con la descripción de fortaleza de los 1-2 ejes top + la explicación de calibración.
- **`strengths`**: las fortalezas de los 3 ejes dominantes (título + descripción + ícono).
- **`workStyle`**: rasgos de estilo de los 2 ejes top.
- **`nextSteps`**: si faltan módulos de calibración → sugerir calibrar; siempre sugerir un simulador.

> Los textos por eje (adjetivo, arquetipo, fortaleza, estilo) están en `AXIS_META` dentro de `vocational-profile.service.ts`. La API debe administrar esta tabla.

---

## 8. Catálogos que la API debe administrar

Para A6 y A7 se necesitan dos catálogos editables (idealmente en BD), **agrupados por eje STEAM**:

### Catálogo de vocaciones (A6)
Por cada eje: lista de `{ name, description, skills[], icon }`.

### Catálogo de carreras (A7)
Por cada eje: lista de `{ careerName, studyPlanHighlights[], careerFields[], relatedSimulatorSlug, icon }`.

> El frontend hoy tiene un catálogo de ejemplo (2 por eje). La API debería ampliarlo y permitir edición desde el panel admin. **La afinidad NO se guarda en el catálogo**: se calcula en runtime con la fórmula de A6/A7.

---

## 9. Endpoints REST sugeridos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/api/v1/tests/questions` | Preguntas del test teórico (ya existe). |
| `POST` | `/api/v1/profile/compute` | **Núcleo**: recibe respuestas + calibración + simuladores, corre A1-A7, devuelve el `VocationalProfile` completo. |
| `POST` | `/api/v1/calibration/submit` | Guarda un módulo de calibración y **recomputa** el perfil. |
| `POST` | `/api/v1/simulator/submit` | Guarda el resultado de un simulador (A3a) y recomputa. |
| `POST` | `/api/v1/universities/match` | A8: matching con IA + filtros. |

**Request de `/profile/compute`:**
```json
{
  "theoreticalAnswers": { "q1": "A", "q2": "C", ... },
  "calibrationResults": [ /* módulos */ ],
  "simulatorResults":   [ /* afinidades */ ]
}
```
**Response:** el objeto `VocationalProfile` completo (ver `vocational-profile.models.ts`).

---

## 10. Consideraciones de sesgo y precisión

1. **No diluir pesos.** La renormalización por eje (A4) es crítica: un usuario sin simuladores no debe ver su perfil "aplanado". El peso ausente se redistribuye, no se pierde.
2. **Calibración premia el interés demostrado** (+15 like vs −8 dislike). Es intencional: queremos detectar pasión, no solo descartar.
3. **Penalizar respuestas automáticas** en simuladores (A3a: `too_fast`, `linear_pattern`). Un usuario que hace clic sin leer no debe inflar su afinidad.
4. **Determinismo auditable.** Guardar siempre las `contributions` para poder explicar "tu perfil se calculó con X, Y, Z".
5. **Versionar los pesos.** Si algún día cambian `55/30/15` o las ganancias, versionar la respuesta (`profileVersion`) para no romper perfiles históricos.

---

## 11. Resumen para arrancar

- **5 algoritmos deterministas** construyen el vector (A1-A5).
- **2 algoritmos deterministas** generan recomendaciones (A6-A7).
- **1 capa de IA** para universidades (A8).
- El contrato de salida ya está fijado en `vocational-profile.models.ts`.
- Prioridad de implementación sugerida: **A1 → A4 → A5 → A6/A7** (perfil mínimo funcional) → **A2/A3** (calibración) → **A8** (universidades).
