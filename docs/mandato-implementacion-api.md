# MANDATO DE IMPLEMENTACIÓN — Motor Vocacional STEAM (API)

> **Documento normativo.** Esto NO es una propuesta: son las instrucciones que el backend debe implementar tal cual.
> Complementa `especificacion-algoritmos-api.md` (explicación) y `algoritmo-universidades-IA.md` (detalle de IA).
> **Fuente de verdad del contrato de tipos:** `src/app/core/models/vocational-profile.models.ts`.

---

## Cómo se lee este documento

- Cada algoritmo es una **tarea cerrada**. No improvises, no cambies fórmulas, no cambies pesos.
- Cada sección trae: **ORDEN**, **ENTRADA**, **PROCEDIMIENTO**, **FÓRMULA**, **SALIDA**, **ACEPTACIÓN**, **PROHIBIDO**.
- Si una implementación no pasa los **Vectores de Prueba** (sección 13), está mal. No se despliega.

---

## 1. Reglas globales obligatorias (RG)

| ID | Regla |
|----|-------|
| **RG-1** | **Determinismo.** Mismo input → mismo output, byte por byte. Nada de aleatoriedad, timestamps ni IA en A1-A7. |
| **RG-2** | **IA prohibida en el núcleo.** Solo A8 (universidades) usa IA. A1-A7 son aritmética pura. |
| **RG-3** | **Respeta el contrato.** La forma del `VocationalProfile` de salida NO se toca. Ver el archivo de modelos. |
| **RG-4** | **Constantes inmutables.** Los pesos (55/30/15) y ganancias (55/10/7) son fijos. Cambiarlos exige subir `profileVersion`. |
| **RG-5** | **Claves sin acento y en minúscula:** `ciencia, tecnologia, ingenieria, artes, matematicas`. Siempre. |
| **RG-6** | **Redondeo y acote.** Todo valor de eje es **entero 0-100**. Usa `clamp(x)=max(0,min(100,round(x)))`. Redondeo estándar (0.5 sube). |
| **RG-7** | **Trazabilidad.** Cada perfil devuelve el array `contributions` con qué fuente aportó qué. Obligatorio. |
| **RG-8** | **Versionado.** Incluye `profileVersion: "1.0.0"` en cada respuesta. |
| **RG-9** | **Sin señal = se omite.** En A2 y A3, un eje sin datos NO entra a la fusión (no lo pongas en 0; omítelo). |

---

## 2. Constantes (cópialas tal cual)

```
PESOS_FUENTE = { theoretical: 0.55, calibration: 0.30, simulator: 0.15 }

GANANCIAS_CALIBRACION = { theoreticalBase: 55, perCalibrationModule: 10, perSimulator: 7 }

CALIBRACION_LIKE   = +15
CALIBRACION_DISLIKE= -8
CALIBRACION_NEUTRAL= 50

SIM_TIME_CAP_SEG   = 20
SIM_BIAS_LINEAL    = -15
SIM_BIAS_RAPIDO    = -10
SIM_BASE_SIN_DATOS = 60

AFINIDAD_FACTOR = 0.85
AFINIDAD_OFFSET = 12

UMBRAL_HIBRIDO  = 15   // diferencia máxima entre eje1 y eje2 para nombre híbrido
```

---

## 3. A1 — Vector teórico (test de 20 preguntas)

**ORDEN:** Convierte las respuestas del test en el vector base.

**ENTRADA:** conteo de aciertos por eje. Cada pregunta suma **+1** al eje (`steamTrait`) de la opción elegida.
```
raw = { ciencia:4, tecnologia:7, ingenieria:3, artes:2, matematicas:4 }
```

**PROCEDIMIENTO:**
1. `max = max(1, raw.ciencia, raw.tecnologia, raw.ingenieria, raw.artes, raw.matematicas)`
2. Para cada eje: `vector[eje] = round( raw[eje] / max * 100 )`

**FÓRMULA:** `vectorBase[eje] = clamp( raw[eje] / max(1, maxRaw) * 100 )`

**SALIDA:** `SteamVector` completo (5 ejes).

**ACEPTACIÓN:** el eje más elegido queda exactamente en 100. Ningún eje negativo. Suma NO tiene que dar 100 (es relativo, no porcentual).

**PROHIBIDO:** normalizar dividiendo entre la suma (eso NO es lo que hace el motor). Se divide entre el **máximo**.

---

## 4. A2 — Vector de calibración (swipes)

**ORDEN:** Convierte los likes/dislikes de los módulos en un vector parcial.

**ENTRADA:** módulos completados. Cada carta trae `axis` y `liked` (bool).
```json
{ "moduleId": "gaming_habits",
  "answers": [ { "axis": "ingenieria", "liked": true }, { "axis": "artes", "liked": false } ] }
```

**PROCEDIMIENTO:**
1. Acumula por eje: `liked` y `disliked`.
2. Para cada eje **con al menos una carta**:
   `vector[eje] = clamp( 50 + liked*15 - disliked*8 )`
3. **Ejes sin ninguna carta: OMITIR** (RG-9).

**SALIDA:** `SteamVector` **parcial** (solo ejes con señal).

**ACEPTACIÓN:** un eje con 2 likes y 0 dislikes = 80. Un eje con 0 likes y 1 dislike = 42. Un eje sin cartas no aparece en el objeto.

**PROHIBIDO:** poner 50 o 0 a los ejes sin señal. Se omiten.

---

## 5. A3 — Vector de simulador (dos partes)

### A3a — Afinidad de UN simulador

**ORDEN:** Calcula la afinidad del usuario con la carrera simulada a partir de sus decisiones.

**ENTRADA:** decisiones de la sesión. Cada opción elegida trae `steamTraitWeight` (pesos por eje), tiempos por paso, y banderas `too_fast` / `linear_pattern_detected`.

**PROCEDIMIENTO:**
1. Acumula `steamTraitWeight` de cada opción elegida, por eje.
   - Si una opción no trae `steamTraitWeight` pero sí `steamArea` (S/T/E/A/M): suma **+10** al eje mapeado (`S→ciencia, T→tecnologia, E→ingenieria, A→artes, M→matematicas`).
2. Normaliza a 0-100 relativo al eje máximo (igual que A1).
3. `primaryScore = steamScoresNormalizado[ejePrincipalDeLaCarrera]`. Si no hubo decisiones puntuables: `primaryScore = 60`.
4. Aplica la fórmula:
```
timeFactor     = min(1, tiempoPromedioSegundos / 20)
biasDeduction  = (linear_pattern_detected ? 15 : 0)
speedDeduction = (too_fast ? 10 : 0)

affinity_score = clamp_10_100(
    round( primaryScore * (0.7 + 0.3*timeFactor) - biasDeduction - speedDeduction )
)          // acote especial: mínimo 10, máximo 100
```
5. Nivel de confianza:
```
too_fast && linear  → 'low'
too_fast || linear  → 'medium'
ninguno             → 'high'
```

**SALIDA:** `SimulatorAffinityResult`:
```json
{ "careerSlug": "software", "axis": "tecnologia", "affinity": 82,
  "biasFlags": { "too_fast": false, "linear_pattern_detected": false } }
```

**ACEPTACIÓN:** con `primaryScore=90`, tiempo promedio ≥20s, sin sesgos → `affinity = 90`. Con sesgo lineal → `−15`.

### A3b — Agregación al vector del perfil

**ORDEN:** Promedia las afinidades de los simuladores por eje.

**PROCEDIMIENTO:** para cada eje, `vector[eje] = round( promedio de affinity de los sim. cuyo axis = eje )`. Ejes sin simulador: OMITIR.

**SALIDA:** `SteamVector` parcial.

---

## 6. A4 — Fusión ponderada (obligatoria, el corazón)

**ORDEN:** Combina A1 + A2 + A3 renormalizando pesos **por eje**.

**PROCEDIMIENTO (para cada uno de los 5 ejes):**
```
partes = [ { peso: 0.55, valor: A1[eje] } ]            // el teórico SIEMPRE aporta
si A2 tiene el eje:  partes.add({ peso: 0.30, valor: A2[eje] })
si A3 tiene el eje:  partes.add({ peso: 0.15, valor: A3[eje] })

pesoTotal        = suma de pesos presentes
vectorFinal[eje] = round( Σ(peso*valor) / pesoTotal )
```

**FÓRMULA CLAVE (RG-9):** el peso de una fuente ausente **NO se pierde ni diluye**: se renormaliza dividiendo entre `pesoTotal`. Un usuario sin simuladores no ve su perfil aplanado.

**ACEPTACIÓN:** eje solo con teórico → `vectorFinal[eje] = A1[eje]` exacto (porque `0.55*v / 0.55 = v`).

**PROHIBIDO:** dividir siempre entre 1.0. Se divide entre la suma de los pesos **presentes**.

**DERIVADO:** `dominantAxes` = los 5 ejes ordenados de mayor a menor `vectorFinal`.

---

## 7. A5 — Medidor de calibración y confianza

**ORDEN:** Calcula el medidor 0-100 y el nivel de confianza.

**PROCEDIMIENTO:**
```
level = clamp( 55 + modulosCompletados*10 + simuladoresCompletados*7 )

level >= 90 → 'altamente_calibrado'
level >= 75 → 'calibrado'
level >= 60 → 'en_calibracion'
else        → 'inicial'
```
La `explanation` es un texto fijo por nivel (ver `CalibrationState` en modelos).

**SALIDA:** objeto `CalibrationState` completo.

---

## 8. A6 — Vocaciones predominantes ✅ (YA DEFINIDO — implementar tal cual)

> **Este algoritmo ya está validado en el motor local y es la mejor implementación determinista posible con catálogo. NO lo rediseñes. Impleméntalo exactamente así.**

**ORDEN:** Devuelve las 4 vocaciones más afines.

**ENTRADA:** `vectorFinal` + `dominantAxes` + catálogo de vocaciones por eje (sección 11).

**PROCEDIMIENTO:**
1. Toma los **3 ejes dominantes**.
2. Por cada eje, recorre su catálogo y asigna afinidad:
   `affinity = clamp( round( vectorFinal[eje] * 0.85 + 12 ) )`
3. Junta todas, ordena por `affinity` desc, **toma 4**.

**SALIDA:** array de `VocationRecommendation` (name, axis, affinity, description, skills[], icon).

---

## 9. A7 — Carreras / planes de estudio ✅ (YA DEFINIDO — implementar tal cual)

> **Igual que A6: ya validado, es la mejor opción determinista. Impleméntalo tal cual.**

**ORDEN:** Devuelve las 5 carreras más afines.

**ENTRADA:** `vectorFinal` + `dominantAxes` + catálogo de carreras por eje (sección 11).

**PROCEDIMIENTO:** idéntico a A6, con dos diferencias:
- Genera `rationale`: `"Encaja con tu fuerte afinidad en {Label}: {descripcionFortaleza}"`.
- Ordena por afinidad y **toma 5**.

**FÓRMULA (misma que A6):** `affinity = clamp( round( vectorFinal[eje] * 0.85 + 12 ) )`

**SALIDA:** array de `CareerRecommendation` (careerName, axis, affinity, rationale, studyPlanHighlights[], careerFields[], relatedSimulatorSlug, icon).

---

## 10. A8 — Universidades (IA + datos) — arquitectura obligatoria

**ORDEN:** Implementa en **2 capas**. La IA NO decide sola.

**CAPA 1 — DETERMINISTA (sin IA):**
1. Filtra universidades que **ofrezcan** alguna carrera de A7 (match duro por BD). Si no la ofrece, se excluye.
2. Calcula `distanceKm` con Google Maps Distance Matrix.
3. Asigna `costTier` desde BD: `public | affordable | private-premium`.
4. Calcula `baseScore`:
```
baseScore = 50
  + (1 - distanceKm/maxDistanceKm) * 25          // cercanía, hasta +25
  + bonoCosto                                     // +15 coincide preferencia, +7 affordable, +0 premium no pedido
  + (rating/5) * 10                               // calidad Google Maps, hasta +10
```

**CAPA 2 — IA (solo ranking fino + explicación):**
- Manda la lista candidata con `baseScore`. La IA ajusta **±10 máximo** y redacta `explanation`.
- `temperature: 0.2`, salida **JSON estricto**.
- **Valida la salida:** si la IA devuelve una universidad que no estaba en la lista, **descártala**.

**OBLIGATORIO (anti-sesgo, va en el prompt):**
- Prohibido favorecer por prestigio o por ser privada/cara.
- Pública/accesible con el mismo programa cerca vale **igual o más**.
- Balance: no devolver solo opciones caras.
- Nada de estereotipos de género/carrera/socioeconómicos.
- Empate → gana la más accesible y cercana.

**FILTROS:** `maxDistanceKm ∈ {10,25,50,100}` y `costPreference ∈ {public, affordable, any}` se aplican **sobre el caché**, NO llamando a la IA cada vez.

> El prompt completo está en `algoritmo-universidades-IA.md`. Úsalo literal.

---

## 11. Catálogos que DEBES administrar (BD + panel admin)

Dos tablas, **agrupadas por eje STEAM**. La afinidad NO se guarda (se calcula en runtime).

**Vocaciones (A6):** `{ axis, name, description, skills[], icon }`
**Carreras (A7):** `{ axis, careerName, studyPlanHighlights[], careerFields[], relatedSimulatorSlug, icon }`

**Tabla `AXIS_META` (para narrativa):** por eje → `{ label, adjective, archetype, strengthTitle, strengthDesc, workStyle[], icon }`. Cópiala de `vocational-profile.service.ts`.

**ORDEN:** arranca con mínimo **3 vocaciones y 3 carreras por eje** (15 + 15). El motor local trae 2 por eje como ejemplo; amplíalo.

---

## 12. Endpoints (contrato exacto)

| Método | Endpoint | Función |
|--------|----------|---------|
| `GET`  | `/api/v1/tests/questions` | Preguntas del test (ya existe). |
| `POST` | `/api/v1/profile/compute` | Corre A1→A7, devuelve `VocationalProfile`. |
| `POST` | `/api/v1/calibration/submit` | Guarda módulo + recomputa perfil. |
| `POST` | `/api/v1/simulator/submit` | Guarda A3a + recomputa perfil. |
| `POST` | `/api/v1/universities/match` | A8 (IA + filtros). |

**`POST /profile/compute` — REQUEST:**
```json
{
  "theoreticalAnswers": { "1": "A", "2": "C", "...": "..." },
  "calibrationResults": [ { "moduleId": "...", "answers": [ { "axis": "...", "liked": true } ] } ],
  "simulatorResults":   [ { "careerSlug": "...", "axis": "...", "affinity": 82, "biasFlags": {} } ]
}
```
**RESPONSE:** objeto `VocationalProfile` completo + `profileVersion` + `contributions`.

---

## 13. Vectores de prueba (tu implementación DEBE reproducir esto)

**Úsalos como test unitario.** Si tu API no da estos números exactos, está mal.

### Entrada
```
Test teórico (conteo):  { ciencia:4, tecnologia:7, ingenieria:3, artes:2, matematicas:4 }
Calibración (1 módulo):
   ciencia: 2 likes / 0 dislikes
   tecnologia: 1 like / 0 dislikes
   ingenieria: 1 like / 0 dislikes
   artes: 0 / 1 dislike
   matematicas: 0 / 1 dislike
Simuladores: 1 completado → { axis: tecnologia, affinity: 82 }
```

### Salidas esperadas (paso a paso)

**A1 (vector teórico), max=7:**
```
{ ciencia:57, tecnologia:100, ingenieria:43, artes:29, matematicas:57 }
```

**A2 (calibración):**
```
{ ciencia:80, tecnologia:65, ingenieria:65, artes:42, matematicas:42 }
```

**A3b (simulador):**
```
{ tecnologia:82 }
```

**A4 (fusión) — cálculo por eje:**
```
ciencia     = (0.55*57 + 0.30*80) / 0.85            = 65
tecnologia  = (0.55*100 + 0.30*65 + 0.15*82) / 1.0  = 87
ingenieria  = (0.55*43 + 0.30*65) / 0.85            = 51
artes       = (0.55*29 + 0.30*42) / 0.85            = 34
matematicas = (0.55*57 + 0.30*42) / 0.85            = 52
```
**Vector FINAL:** `{ ciencia:65, tecnologia:87, ingenieria:51, artes:34, matematicas:52 }`
**dominantAxes:** `[ tecnologia, ciencia, matematicas, ingenieria, artes ]`

**A5 (calibración):** módulos=1, sims=1
```
level = 55 + 10 + 7 = 72  →  confidence = 'en_calibracion'
```

**A6/A7 (afinidades de los 3 ejes dominantes):**
```
tecnologia  = round(87*0.85 + 12) = 86
ciencia     = round(65*0.85 + 12) = 67
matematicas = round(52*0.85 + 12) = 56
```

**Narrativa:** eje1=tecnologia(87), eje2=ciencia(65). Diferencia 22 > 15 → **NO híbrido**.
```
profileName      = "Perfil Tecnológico"
profileArchetype = "Creador Digital"
```

---

## 14. Definition of Done (checklist de cierre)

- [ ] A1-A7 son deterministas y sin IA (RG-1, RG-2).
- [ ] Pesos y ganancias son las constantes de la sección 2, sin excepción.
- [ ] A4 renormaliza por eje (un eje solo-teórico devuelve el valor del teórico intacto).
- [ ] A2/A3 omiten ejes sin señal (no los ponen en 0).
- [ ] La respuesta cumple el contrato `VocationalProfile` + `contributions` + `profileVersion`.
- [ ] La API reproduce **exactamente** los Vectores de Prueba de la sección 13.
- [ ] A8 usa 2 capas; la IA no inventa universidades; los filtros corren sin IA.
- [ ] Catálogos con mínimo 3 vocaciones y 3 carreras por eje.

---

## 15. Orden de implementación obligatorio

```
1º  A1 → A4 → A5 → A6 → A7      (perfil mínimo funcional, solo test teórico)
2º  A2 y A3                     (calibración y simuladores alimentan la fusión)
3º  A8                          (universidades con IA)
```

No pases a la siguiente etapa sin que la anterior pase sus Vectores de Prueba.
