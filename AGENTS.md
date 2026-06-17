# AGENTS.md

Guia permanente para trabajar con Codex en esta PWA. Antes de modificar codigo, leer esta guia junto con la estructura real del proyecto.

## Descripcion Del Proyecto

Esta aplicacion es una PWA de orientacion vocacional STEAM para jovenes. Ayuda a descubrir afinidades en Ciencia, Tecnologia, Ingenieria, Artes y Matematicas mediante test vocacional, calibraciones, simuladores de carrera, resultados tipo ADN STEAM, recomendaciones de universidades cercanas, historial y perfil.

El proyecto usa Angular 19 con componentes standalone, Angular Router, RxJS, signals en algunos modulos, SCSS, Angular Service Worker, Angular Google Maps, Chart.js, GSAP, html2canvas y jsPDF.

## Estructura Real

- `src/app/app.routes.ts`: rutas principales, guards y lazy loading de features.
- `src/app/app.config.ts`: providers globales, HTTP client con interceptor, router, animaciones, service worker, charts y Firebase.
- `src/app/pages`: pantallas principales.
  - `onboarding`, `login`, `register`, `forgot-password`, `oauth-callback`.
  - `dashboard`, `evaluations`, `test-result`, `history`, `explore`, `profile`.
  - `admin/*`: dashboard, usuarios, preguntas del test, simuladores, logs IA, settings.
- `src/app/features`: modulos funcionales grandes.
  - `career-simulator`: catalogo, flujo de simulador, resultado y pasos.
  - `universities-map`: mapa dedicado de universidades.
- `src/app/core/services`: integraciones, estado y API.
- `src/app/core/guards`: `authGuard`, `guestGuard`, `adminGuard`, `missionUnlockGuard`.
- `src/app/core/interceptors`: `auth.interceptor.ts` agrega JWT y maneja 401.
- `src/app/core/models`: modelos de universidad y simulador.
- `src/app/components`: UI compartida: header, navbar, toast, splash, icons, PDF templates, admin sidebar.
- `src/api/ia`: serverless IA para feedback de simulador; existe, pero el frontend actual no la llama.
- `public`: manifest, iconos, assets y favicon.

## Modulos Principales

- Test teorico vocacional: `src/app/pages/evaluations`.
  - Carga preguntas desde API.
  - Guarda respuestas en `localStorage`.
  - Navega a `test-result`.
- Calibracion: `src/app/pages/evaluations/hobbies-test`.
  - Decks locales por modulo: `gaming_habits`, `physical_hobbies`, `digital_consumption`, `everyday_mechanics`.
  - Guarda resultados con `AuthService.submitCalibration`.
- Simulador de carreras: `src/app/features/career-simulator`.
  - Catalogo desde API.
  - Detalle por slug desde API.
  - Pasos: contexto, analisis de datos, decision tradeoff, sorpresa, feedback IA visual, reflexion emocional.
  - Resultado usa `CareerSimulatorService.submitForAIFeedback`.
- ADN STEAM / resultados: `src/app/pages/test-result`.
  - Procesa resultado de API del test.
  - Muestra perfil, scores, recomendaciones, PDF y busqueda por ubicacion.
- Universidades cercanas: `src/app/pages/explore` y `src/app/features/universities-map`.
  - Usa Google Maps JS y Google Places REST mediante `UniversityService`.
  - Favoritos se guardan via `UserService`.
- IA:
  - Test vocacional y recomendaciones llegan desde backend actual por `/tests/submit`.
  - `src/api/ia/career-simulator-feedback.ts` implementa Gemini para simulador, pero no esta conectado desde Angular.
  - Admin AI logs se consultan por `AdminService.getAiLogsStats`.
- Historial: `src/app/pages/history`.
  - Lista, renombra y elimina tests mediante `VocationTestService`.
- Perfil: `src/app/pages/profile`.
  - Perfil de usuario, avatar, password, preferencias, tema, badges y logout.

## Servicios Y API Existentes

- `AuthService`: registro, OTP, login, verify-login, recovery, Google OAuth redirect, perfil, logout y calibracion.
- `VocationTestService`: preguntas, submit, historial, detalle, latest, rename, delete.
- `UserService`: perfil, avatar, password, settings, universidades/cursos guardados.
- `AdminService`: usuarios, preguntas, logs IA, simuladores.
- `CareerSimulatorService`: catalogo, detalle, sesion, progreso local y feedback mock del simulador.
- `UniversityService`: Google Places nearby search.
- `GoogleMapsLoaderService`: carga script de Google Maps.
- `ThemeService`: aplica `body.dark-theme`.
- `ToastService`: notificaciones globales.

Contrato base actual: `environment.apiUrl` apunta a `https://vocacionessteam-api-production-d44b.up.railway.app/api/v1`.

## Partes API Vs Local

Conectado a API:
- Auth, perfil, recuperacion de password y Google OAuth.
- Preguntas, submit, historial y detalle del test.
- Calibracion.
- Usuarios, preguntas, simuladores y AI logs en admin.
- Universidades/cursos guardados.
- Google Maps/Places.

Local, mock o fallback:
- Decks de calibracion.
- Feedback final del simulador de carrera en `CareerSimulatorService.submitForAIFeedback`.
- Progreso de simuladores en `localStorage`.
- Scores de simulador en `localStorage` con clave `sim_score_${slug}`.
- Cache de test y answers en `localStorage`.
- KPIs y actividad reciente del dashboard admin.
- Settings admin.
- Badges visuales de perfil.

## Reglas De Seguridad

- No romper API existente ni cambiar endpoints, payloads o modelos de respuesta sin documentarlo de forma explicita.
- Si una mejora no coincide con la API actual, crear servicio local, mock, adapter o fallback temporal.
- No cambiar contratos de backend salvo que sea estrictamente necesario. Si ocurre, documentar:
  - endpoint afectado,
  - payload anterior,
  - payload nuevo,
  - migracion requerida,
  - pantallas afectadas.
- Mantener compatibilidad con login, guards, interceptor, dashboard, test, calibracion, simulador, resultados, mapa, historial, perfil y admin.
- Mantener responsive desktop/movil.
- Mantener modo claro/oscuro usando tokens globales o overrides compatibles con `body.dark-theme`.
- No eliminar codigo funcional sin justificarlo.
- No hacer refactors masivos si la tarea pide una mejora puntual.
- No guardar secretos nuevos en `src/environments`; las claves de IA deben vivir en server/env vars.
- Cualquier conexion nueva a `/api/...` debe revisar el interceptor, porque reescribe URLs que empiezan con `/api/`.
- Cuando uses `localStorage`, mantener claves por usuario si el dato pertenece a una cuenta.
- Si se agrega mock, nombrarlo y aislarlo para que sea facil reemplazarlo por API.

## Convenciones De Nombres

- Componentes Angular: `*.component.ts`, `*.component.html`, `*.component.scss`.
- Servicios: `*.service.ts`, inyectables con `providedIn: 'root'`.
- Guards: `*.guard.ts`.
- Interceptors: `*.interceptor.ts`.
- Modelos/tipos compartidos: `src/app/core/models/*.model.ts` o interfaces cerca del servicio si solo aplican ahi.
- Features grandes: `src/app/features/<feature-name>`.
- Paginas ruteadas: `src/app/pages/<route-name>`.
- Componentes compartidos: `src/app/components/<component-name>`.
- Estilos por componente en SCSS; estilos globales y tokens en `src/styles.scss`.
- Claves locales existentes:
  - `steam_pwa_token`
  - `steam_pwa_user`
  - `hasTakenTest_${userId}`
  - `test_answers_${userId}`
  - `test_result_${userId}`
  - `test_raw_scores_${userId}`
  - `test_location_${userId}`
  - `steam_completed_simulators`
  - `sim_score_${careerId}`
  - `steam_profile`

## Convenciones Para Componentes

- Preferir componentes standalone, como el resto del proyecto.
- Importar explicitamente `CommonModule`, `FormsModule`, `RouterModule` u otros modulos necesarios en cada componente standalone.
- Mantener templates simples y respetar estados de carga, error y empty state.
- No bloquear al usuario si una llamada opcional falla; mostrar toast o fallback.
- En mobile, verificar botones fijos, modales, mapas y tarjetas con contenido largo.
- Si hay animaciones con GSAP, limpiar contextos/timers en `ngOnDestroy`.
- Para flujo protegido, validar guards y navegacion despues del cambio.

## Convenciones Para Servicios Y API

- Centralizar llamadas HTTP en servicios de `src/app/core/services`.
- Mantener interfaces o modelos cerca del servicio si son especificos; mover a `core/models` si se comparten.
- Transformar respuestas de API en adapters dentro del servicio, no en multiples componentes.
- Para fallbacks, usar RxJS (`catchError`, `of`, `throwError`) de forma explicita y sin ocultar errores criticos.
- No duplicar `environment.apiUrl` fuera de servicios.
- Cuidar el interceptor: agrega `Authorization` a requests API y redirige a `/login` en 401.

## Convenciones Para Tipos

- No usar `any` nuevo salvo en bordes de API o datos aun no normalizados.
- Si la API devuelve campos alternativos, normalizar en el servicio.
- Para simuladores, respetar `CareerSimulatorData`, `SimulatorStep`, `SimulatorStepType`, `UserStepDecision` y `SimulatorFeedbackResponse`.
- Para tests, respetar `Question`, `Option`, `TestSubmissionResponse`, `TestHistorySummary`, `TestDetail`.
- Para universidades, respetar `University` y `UniversityRecommendation`.

## Convenciones Para Estilos

- Usar variables globales de `src/styles.scss` cuando sea posible:
  - `--bg-canvas`, `--bg-surface`, `--bg-elevated`
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - `--border-color`, `--accent-primary`
  - `--steam-blue`, `--steam-orange`, `--steam-green`, `--steam-red`
- Mantener compatibilidad con `body.dark-theme`.
- Evitar estilos inline nuevos; hay algunos existentes, pero nuevas pantallas deben preferir SCSS.
- Cuidar `overflow-x`, mapas y modales en mobile.
- No introducir cambios visuales globales sin revisar dashboard, explore, result, profile y admin.

## Convenciones Para Mocks Y Fallbacks

- Ubicar mocks cerca del servicio o en un archivo dedicado si crecen.
- Nombrar claramente: `mock`, `fallback`, `local`.
- Documentar que endpoint reemplazaria el mock.
- No mezclar mock con datos reales sin indicar procedencia en el codigo.
- El usuario no debe quedar bloqueado si el fallback es razonable.
- Para AI, mantener timeout/fallback y evitar exponer API keys en frontend.

## PWA, Tema Y Responsive

- PWA configurada con `ngsw-config.json`, `public/manifest.webmanifest` y service worker en produccion.
- `AppComponent` escucha updates de service worker y muestra prompt de recarga.
- `ThemeService` controla clase global `dark-theme`.
- La preferencia de tema se guarda via `UserService.updateSettings({ darkMode })` desde perfil.
- La navbar global se muestra para rutas de usuario seleccionadas y se oculta en admin.

## Comandos Detectados

- `npm start`: inicia `ng serve`.
- `npm run build`: ejecuta `ng build`.
- `npm run watch`: ejecuta `ng build --watch --configuration development`.
- `npm test`: ejecuta `ng test` con Karma.
- `npm run ng`: wrapper para Angular CLI.

No hay scripts dedicados de `lint` ni `typecheck` en `package.json`.

## Checklist Obligatorio Antes De Terminar Una Fase

1. Revisar estructura afectada antes de editar: rutas, componente, servicio, modelo, estilo y llamadas API.
2. Confirmar si la funcionalidad toca API real, estado local o mock.
3. Mantener contratos existentes o documentar cualquier cambio.
4. Probar estados: loading, success, error, empty.
5. Revisar responsive mobile y desktop cuando haya UI.
6. Revisar modo claro y oscuro cuando haya UI.
7. Verificar que login, guards y navegacion no se rompen si el cambio toca rutas o auth.
8. Verificar que mapa, test, resultados, calibracion y simulador sigan compatibles si se toca data compartida.
9. Ejecutar validaciones disponibles:
   - minimo `npm run build`,
   - `npm test` si la tarea lo permite y el entorno soporta Karma/Chrome.
10. Revisar `git status --short` y no revertir cambios ajenos.
11. En el resumen final incluir:
   - archivos modificados,
   - que se agrego,
   - que quedo local/mock,
   - que queda pendiente para API,
   - riesgos detectados,
   - pruebas realizadas.

