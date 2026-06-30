# A8 — Matching de Universidades con IA

> Documento complementario a `especificacion-algoritmos-api.md`.
> Cubre el único algoritmo que **sí** usa IA, su arquitectura recomendada y el prompt.

---

## 1. La idea original (del equipo) y mi recomendación

**Idea original:** tomar las carreras recomendadas + la lista de universidades cercanas, mandar **todo** a la IA, y que la IA devuelva la lista con % de match, filtros por km y costo, y explicaciones.

**Mi recomendación: SÍ usar IA, pero NO para todo.** El error más común (y costoso) es dejar que la IA haga el trabajo que un cálculo determinista hace mejor, más barato y sin alucinar. La clave es separar en **2 capas**:

```
CAPA DETERMINISTA (datos duros)          CAPA IA (lenguaje y matiz)
─────────────────────────────           ──────────────────────────
✓ ¿La universidad ofrece la carrera?     ✓ Redactar el "por qué te conviene"
✓ Distancia en km (Google Maps)          ✓ Desempate fino del ranking
✓ Costo (público/privado, rango)         ✓ Resaltar pros/contras según el perfil
✓ Aplicar filtros (km, economía)         ✓ Tono cercano para el estudiante
✓ Score base de match
```

**Por qué esta separación es la correcta:**

1. **La IA NO debe inventar universidades ni datos.** Solo puede rankear y explicar universidades de la lista real (BD + Google Maps). Si le pides que "sugiera universidades", alucinará campus, colegiaturas y carreras que no existen. Regla dura: **la IA recibe la lista y solo la ordena y explica; nunca agrega.**

2. **El % de match debe anclarse en un hecho real:** ¿la universidad **realmente ofrece** esa carrera? Eso es un dato de BD (match duro), no una opinión de la IA. La IA ajusta ±, pero no decide si el programa existe.

3. **Los filtros (km, costo) deben funcionar SIN llamar a la IA.** Distancia = Google Maps Distance Matrix. Costo = campo en BD. Así el usuario puede mover el slider de 10→50→100 km y filtrar público/privado **al instante**, sin esperar (ni pagar) una llamada a la IA cada vez.

4. **Costo y caché.** Llamar a la IA por cada cambio de filtro es caro y lento. Se llama **una vez** (o cuando cambian las carreras), se cachea el resultado, y los filtros se aplican sobre el caché.

---

## 2. Arquitectura del flujo

```
1. A7 produce las carreras recomendadas.
2. BD + Google Maps Places → universidades en el radio máximo (100 km) que ofrezcan
   alguna de esas carreras.   ◄── match DURO: programa existe
3. Por cada universidad candidata, calcular DETERMINISTA:
      - distanceKm           (Google Maps)
      - costTier             (BD: public / affordable / private-premium)
      - baseScore            (fórmula sección 3)
4. UNA llamada a la IA con la lista candidata → devuelve, por universidad:
      - matchScore final (ajuste sobre baseScore, acotado)
      - explanation (2-3 frases)
5. Cachear el resultado.
6. Front aplica filtros (km, costo) sobre el caché → instantáneo.
```

---

## 3. Score base determinista (antes de la IA)

```
baseScore (0-100) =
    50  (si la universidad ofrece la carrera; si no, se EXCLUYE)
  + bono por cercanía:   (1 - distanceKm / maxDistanceKm) * 25      → hasta +25
  + bono por ajuste de costo:                                        → hasta +15
        +15 si coincide con la preferencia del usuario (ej. pidió "público" y es público)
        +7  si es "affordable"
        +0  si es premium y no lo pidió
  + bono por calidad (rating Google Maps):  (rating / 5) * 10        → hasta +10
```

La IA recibe este `baseScore` y puede ajustarlo **±10 como máximo**, justificándolo. Así la IA refina pero no rompe la lógica de datos.

---

## 4. El prompt para la IA (con anti-sesgo)

```
SISTEMA:
Eres un orientador vocacional imparcial para estudiantes de México. Tu única tarea
es RANKEAR y EXPLICAR universidades de una lista que se te entrega. Trabajas para un
estudiante real que necesita una decisión justa y honesta.

REGLAS ESTRICTAS:
1. SOLO puedes usar universidades de la lista proporcionada. NUNCA inventes
   universidades, carreras, colegiaturas, fechas ni datos que no estén en la lista.
2. Si te falta un dato, dilo explícitamente ("información no disponible"); no lo supongas.
3. El % de match que devuelvas debe partir del "baseScore" dado. Puedes ajustarlo
   como máximo ±10 puntos, y debes justificar el ajuste con datos de la lista.
4. Basa tu razonamiento ÚNICAMENTE en: ajuste del programa a la carrera recomendada,
   distancia, costo, modalidad y rating. NADA más.

ANTI-SESGO (obligatorio):
5. NO favorezcas universidades por prestigio, fama o por ser privadas/caras.
   Una universidad pública o económica que ofrece el mismo programa cerca del
   estudiante es IGUAL o MÁS valiosa.
6. Presenta un balance: no devuelvas solo opciones caras. Si hay opciones
   públicas/accesibles válidas, deben aparecer arriba cuando los datos lo respalden.
7. No asumas el género, nivel socioeconómico, etnia ni capacidades del estudiante.
8. No uses estereotipos de carrera ("esto es para hombres/mujeres", etc.).
9. Si dos universidades empatan en datos, prioriza la más accesible
   económicamente y la más cercana.

ENTRADA (JSON):
{
  "studentProfile": { "dominantAxes": ["tecnologia","matematicas"], "calibrationLevel": 82 },
  "recommendedCareers": [ { "careerName": "Ingeniería en Software", "axis": "tecnologia" } ],
  "filters": { "maxDistanceKm": 50, "costPreference": "affordable" },
  "candidateUniversities": [
    {
      "universityId": "uuid",
      "name": "...",
      "offersCareer": "Ingeniería en Software",
      "distanceKm": 12.4,
      "costTier": "public",
      "tuitionRange": "...",
      "rating": 4.5,
      "modality": "presencial",
      "baseScore": 84
    }
  ]
}

SALIDA (JSON estricto, sin texto extra):
{
  "matches": [
    {
      "universityId": "uuid",
      "matchScore": 88,
      "explanation": "Ofrece exactamente Ingeniería en Software, es pública y está a
                      12 km de ti. Su rating de 4.5 y modalidad presencial encajan con
                      tu preferencia de opción accesible.",
      "scoreAdjustmentReason": "+4 por coincidencia con preferencia económica y cercanía"
    }
  ]
}
```

**Parámetros de la llamada:**
- `temperature: 0.2-0.3` (queremos consistencia, no creatividad).
- `response_format: json` (forzar JSON válido).
- Validar el JSON de salida; si la IA devolviera una universidad fuera de la lista, **descartarla**.

---

## 5. Eliminación de sesgos — resumen

| Sesgo | Cómo lo evitamos |
|-------|------------------|
| **Prestigio/marca** | Regla 5: prohibido favorecer por fama o por ser privada. |
| **Económico** | `costPreference` + bono determinista + reglas 5/6/9 priorizan accesibles. |
| **Alucinación** | Reglas 1/2: solo lista real; validación de salida descarta inventos. |
| **Estereotipo de carrera/género** | Reglas 7/8. |
| **Sobre-ponderar la IA** | El % parte de un `baseScore` determinista; la IA solo ajusta ±10. |
| **Lentitud/costo** | Filtros aplican sobre caché; la IA se llama una sola vez. |

---

## 6. Recomendación final

- **Sí, usa IA para universidades** — es el lugar correcto: ranking difuso + explicación en lenguaje natural.
- **Pero ánclala en datos duros** (programa, km, costo) y **limita su poder** (ajuste ±10, lista cerrada).
- **Filtros del lado de datos**, no de la IA → instantáneos y baratos.
- **Google Maps** aporta distancia y rating reales; la IA los interpreta, no los inventa.
- Con esto obtienes precisión, costo bajo, cero alucinaciones y un trato justo a opciones públicas/accesibles — clave para estudiantes en México.
```
