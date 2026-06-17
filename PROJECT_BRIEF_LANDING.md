# Ficha Técnica y Brief de Diseño: PWA Vocaciones STEAM

Este documento contiene toda la información de contexto, arquitectura técnica, tokens de diseño y directrices de desarrollo necesarios para que cualquier modelo de IA o equipo de desarrollo diseñe e implemente una Landing Page premium, coherente y alineada con la esencia del proyecto.

---

## 1. Descripción General del Proyecto

*   **Nombre de la Aplicación**: PWA Vocaciones STEAM (steam-vocation-pwa)
*   **Propósito**: Una aplicación web progresiva (PWA) de orientación vocacional enfocada en las disciplinas **STEAM** (Science, Technology, Engineering, Arts, y Mathematics). Ayuda a los estudiantes a calibrar sus intereses, simular decisiones reales de carreras y encontrar universidades cercanas que ofrezcan programas adecuados basados en su perfil psicométrico.
*   **Público Objetivo**: Estudiantes de secundaria/bachillerato buscando orientación universitaria, interesados en ciencia, tecnología, ingeniería, artes digitales y matemáticas.
*   **Enfoque Visual**: Moderno, premium, tecnológico e interactivo. Hace uso extensivo de transiciones fluidas, animaciones micro-táctiles y glassmorphism.

---

## 2. Pila Tecnológica (Tech Stack)

*   **Framework**: Angular (Single Page Application - SPA) con TypeScript.
*   **Enrutamiento**: Angular Router.
*   **Estilos**: SCSS (Sass estructurado con variables globales y CSS nativo).
*   **Mapas y Geolocalización**: API de Google Maps & Google Places (módulo oficial `@angular/google-maps`).
*   **Iconografía**: Lucide Icons (mediante componente personalizado `<app-lucide-icon>`).

---

## 3. Arquitectura de Páginas y Funcionalidades Clave

Para reflejar fielmente el producto en la landing page, estas son las vistas y flujos del sistema:

1.  **Onboarding / Bienvenida (`/welcome`)**: Pantalla de introducción limpia con ilustraciones de vocaciones y llamadas a la acción rápidas para iniciar sesión o registrarse.
2.  **Evaluaciones Vocacionales (`/evaluations`)**: Cuestionarios interactivos de calibración de pasatiempos y aptitudes que generan el perfil psicométrico del usuario.
3.  **Simulador de Carreras (`/career-simulator`)**: Un simulador dinámico que coloca al estudiante ante escenarios profesionales reales divididos en 6 pasos clave:
    *   *📋 Contexto*: Planteamiento de la misión profesional.
    *   *🔍 Análisis de Datos*: Interpretación de métricas o gráficos.
    *   *⚖️ Tradeoff / Decisión*: Elección de dilemas éticos/técnicos.
    *   *⚡ Evento Sorpresa*: Un cambio imprevisto que evalúa adaptabilidad.
    *   *🤖 Feedback IA*: Evaluación cualitativa en tiempo real de las respuestas del usuario apoyada por IA.
    *   *💭 Reflexión Emocional*: El usuario evalúa cómo se sintió durante la simulación.
4.  **Exploración de Universidades (`/explore`)**: Mapa interactivo que muestra las universidades recomendadas cercanas al usuario en base a su perfil dominante (STEAM), permitiendo guardar favoritos.
5.  **Panel de Administración (`/admin`)**: Gestión del sistema, registro de prompts e interacciones con IA, calibración de tests y auditoría de uso.

---

## 4. Sistema de Diseño (Design Tokens)

El proyecto utiliza variables CSS globales para asegurar consistencia cromática y cinética. Estos tokens deben ser respetados en la Landing Page:

### Colores de Marca e Identidad
```css
:root {
  --steam-blue: #07B1C9;    /* Cyan insignia (Ciencia / Tecnología) */
  --steam-orange: #F88718;  /* Naranja brillante (Ingeniería) */
  --steam-green: #4DB046;   /* Verde vibrante (Matemáticas) */
  --steam-red: #E8372D;     /* Rojo/Rosa coral (Artes) */
}
```

### Paleta Semántica y Modos (Claro / Oscuro)
La aplicación cuenta con soporte nativo para **Dark Mode** mediante la clase `.dark-theme` en el cuerpo del documento.

| Token | Light Mode (Por defecto) | Dark Mode (`body.dark-theme`) |
| :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` (Gris claro) | `#0A0A0A` (Negro absoluto) |
| `--bg-surface` | `#FFFFFF` | `#1F2937` (Gris oscuro) |
| `--bg-glass` | `rgba(255, 255, 255, 0.85)` | `rgba(31, 41, 55, 0.85)` |
| `--text-primary`| `#1E293B` (Azul pizarra) | `#F9FAFB` (Blanco tiza) |
| `--text-secondary`| `#64748B` | `#9CA3AF` |
| `--border-color`| `#E2E8F0` | `#374151` |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(20, 20, 20, 0.4)` |
| `--glass-border`| `rgba(255, 255, 255, 0.5)` | `rgba(255, 255, 255, 0.08)` |
| `--glass-shadow`| `0 8px 32px 0 rgba(31, 38, 135, 0.07)`| `0 8px 32px 0 rgba(0, 0, 0, 0.5)` |

*Nota: En Dark Mode, la variable `--steam-blue` muta a un tono neón `#00E5FF` para mayor legibilidad y contraste.*

### Tokens de Movimiento y Animación
Basados en la filosofía de diseño interactivo de *Emil Kowalski* (fricciones físicas naturales y retroalimentación táctil inmediata):
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* Rápido/Inmediato (hovers, botones) */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* Transiciones orgánicas de layouts */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Rebotes fluidos y juguetones */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* Despliegues tipo iOS */

--duration-tactile: 120ms;
--duration-hover: 200ms;
--duration-panel: 300ms;
```

---

## 5. Requerimientos de la Landing Page (Efecto Scroll Animado - Apple Style)

El núcleo visual de la landing page será una sección de **scroll interactivo paso a paso** controlado por fotogramas.

### Conceptos Sugeridos para la Animación

1.  **El Prisma de Decisiones (Metáfora de la Simulación)**:
    *   Un prisma tridimensional flotante en el centro de la pantalla.
    *   Conforme bajas, se le proyectan gráficas de análisis en cian (`#07B1C9`), luego se divide en dos para mostrar dilemas (*Tradeoffs*), sufre un glitch de energía (*Sorpresa*), es realineado por un escudo magnético (*IA*), y finaliza refractando un haz de luz arcoíris (**STEAM**).
2.  **El Ensamble de la Estación de Trabajo**:
    *   Los componentes mecánicos y de cristal de un visor o consola futurista flotan deconstruidos.
    *   Al hacer scroll, las piezas se encajan suavemente (lentes de Ciencia, chips de Tecnología, carcasa de Ingeniería, UI de Arte, rejillas de Matemáticas) hasta encenderse con el menú del simulador en pantalla.

### Guía Técnica de Implementación para la IA

*   **Técnica Recomendada**: Animación basada en `<canvas>` HTML5 en lugar de reemplazo masivo de elementos `<img>`.
*   **Librerías sugeridas**: **GSAP (GreenSock)** y **ScrollTrigger** para vincular el progreso del scroll al número de fotograma.
*   **Recursos**: Una secuencia de **45 a 70 imágenes WebP** optimizadas con canal alfa (transparentes) para integrarse orgánicamente con el cambio de tema claro/oscuro de la landing page.
*   **Preloading**: El script de la landing page debe precargar el array de imágenes antes de permitir el scroll dinámico para evitar parpadeos visuales (*flash of unpainted content*).

---

## 6. Estructura de Secciones de la Landing Page

Para guiar la creación del código de la landing page, se recomienda la siguiente secuencia:

1.  **Hero Section**:
    *   *Título*: "Diseña tu mañana en el presente. Explora tu vocación STEAM."
    *   *Subtítulo*: "Simula el día a día de carreras del futuro, pon a prueba tus habilidades de toma de decisión con IA y encuentra universidades perfectas para ti."
    *   *CTAs*: Botón principal ("Comenzar Simulación" -> `/register`) con sombra de brillo difuso y botón secundario ("Iniciar Sesión" -> `/login`).
2.  **Interactive Canvas Scroll (La Animación Principal)**:
    *   Pantalla completa fija (*pinned section*). A medida que el usuario hace scroll, se reproduce el ensamble del prisma o dispositivo, acompañado de textos cortos que se desvanecen lateralmente explicando cada paso del simulador.
3.  **Bento Grid de Características**:
    *   *Celda 1 (Simulación Realista)*: Captura de pantalla o gráfico del flujo de dilemas técnicos.
    *   *Celda 2 (Orientación con IA)*: Explicación de cómo la inteligencia artificial calibra y da feedback personalizado.
    *   *Celda 3 (Mapa de Oportunidades)*: Vista miniatura de un mapa con marcadores interactivos cian/rojos.
4.  **Testimonio / Prueba Social**:
    *   Comentarios de estudiantes reales que encontraron su carrera mediante la plataforma.
5.  **Footer**:
    *   Enlaces legales, accesos rápidos y selector de tema (Light/Dark).
