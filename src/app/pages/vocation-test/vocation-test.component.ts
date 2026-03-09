import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';

interface Option {
    id: string;
    texto: string;
    valor_steam: string;
    valor_riasec: string;
    habilidad_blanda: string;
}

interface Question {
    id: number;
    tema_etiqueta: string;
    contexto: string;
    imagen_contexto_url: string;
    pregunta: string;
    opciones: Option[];
}

@Component({
    selector: 'app-vocation-test',
    standalone: true,
    imports: [CommonModule, SplashScreenComponent],
    templateUrl: './vocation-test.component.html',
    styleUrls: ['./vocation-test.component.scss']
})
export class VocationTestComponent implements OnInit {

    // Test states: 'onboarding' | 'questionnaire' | 'analyzing'
    viewState: 'onboarding' | 'questionnaire' | 'analyzing' = 'onboarding';

    // Questions Data
    questions: Question[] = [
        {
            "id": 1,
            "tema_etiqueta": "Medio Ambiente",
            "contexto": "Tu ciudad quiere limpiar un río muy contaminado y te invitan a liderar una parte del proyecto.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/34d399?text=Proyecto+Rio+Limpio",
            "pregunta": "¿En qué área sientes que aportarías más valor?",
            "opciones": [
                { "id": "A", "texto": "Tomar muestras del agua para analizar los niveles de toxicidad en un laboratorio.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "meticulosidad" },
                { "id": "B", "texto": "Diseñar un sistema de redes y filtros mecánicos para atrapar la basura automáticamente.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "resolucion de problemas" },
                { "id": "C", "texto": "Crear un modelo estadístico para predecir en qué zonas se acumulará más basura.", "valor_steam": "matematicas", "valor_riasec": "convencional", "habilidad_blanda": "pensamiento analitico" },
                { "id": "D", "texto": "Crear una campaña visual impactante en redes sociales para concientizar a la población.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "comunicacion empatica" }
            ]
        },
        {
            "id": 2,
            "tema_etiqueta": "Desarrollo de Videojuegos",
            "contexto": "Estás colaborando en la creación de un nuevo videojuego de supervivencia donde los personajes son del tamaño de un insecto y deben sobrevivir en un jardín.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/22c55e?text=Supervivencia+Microscopica",
            "pregunta": "¿De qué parte del desarrollo te encargas?",
            "opciones": [
                { "id": "A", "texto": "Programar la inteligencia artificial de los insectos para que reaccionen al jugador.", "valor_steam": "tecnologia", "valor_riasec": "investigador", "habilidad_blanda": "logica algoritmica" },
                { "id": "B", "texto": "Modelar en 3D los entornos, la iluminación del sol filtrada por las hojas y las texturas.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "creatividad visual" },
                { "id": "C", "texto": "Investigar la anatomía y comportamiento real de las hormigas y arañas para darle realismo.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "investigacion profunda" },
                { "id": "D", "texto": "Calcular y balancear las estadísticas del juego (daño, salud, probabilidades de encontrar recursos).", "valor_steam": "matematicas", "valor_riasec": "convencional", "habilidad_blanda": "equilibrio de sistemas" }
            ]
        },
        {
            "id": 3,
            "tema_etiqueta": "Ciberseguridad",
            "contexto": "Una empresa detecta un comportamiento inusual en su red y sospecha que sus datos están siendo vulnerados por un ataque externo.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/ef4444?text=Alerta+Cibernetica",
            "pregunta": "¿Cómo reaccionas ante esta crisis cibernética?",
            "opciones": [
                { "id": "A", "texto": "Aislar los servidores afectados, analizar el tráfico y neutralizar el malware inyectado.", "valor_steam": "tecnologia", "valor_riasec": "investigador", "habilidad_blanda": "reaccion bajo presion" },
                { "id": "B", "texto": "Auditar la infraestructura física de los servidores para asegurar que no hubo acceso manual.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "atencion al detalle" },
                { "id": "C", "texto": "Analizar los patrones criptográficos del ataque para descubrir la identidad de los atacantes.", "valor_steam": "matematicas", "valor_riasec": "investigador", "habilidad_blanda": "reconocimiento de patrones" },
                { "id": "D", "texto": "Explicar la situación a los clientes afectados mediante un comunicado claro y empático.", "valor_steam": "arte", "valor_riasec": "social", "habilidad_blanda": "comunicacion de crisis" }
            ]
        },
        {
            "id": 4,
            "tema_etiqueta": "Exploración Espacial",
            "contexto": "Se está planeando construir el primer hábitat humano permanente en Marte.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/f97316?text=Habitat+Marciano",
            "pregunta": "¿Qué problema te gustaría resolver?",
            "opciones": [
                { "id": "A", "texto": "Investigar cómo cultivar plantas comestibles en suelo marciano (regolito).", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "innovacion sostenible" },
                { "id": "B", "texto": "Diseñar los planos arquitectónicos de las cúpulas para que resistan la radiación y tormentas de arena.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "diseno estructural" },
                { "id": "C", "texto": "Programar los sistemas autónomos de soporte vital y reciclaje de oxígeno.", "valor_steam": "tecnologia", "valor_riasec": "convencional", "habilidad_blanda": "automatizacion" },
                { "id": "D", "texto": "Diseñar los interiores para que los astronautas no sufran estrés psicológico por el encierro.", "valor_steam": "arte", "valor_riasec": "social", "habilidad_blanda": "empatia espacial" }
            ]
        },
        {
            "id": 5,
            "tema_etiqueta": "Big Data y Deportes",
            "contexto": "Tienes acceso a una base de datos gigante con las estadísticas de todos los partidos de fútbol de la última década.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/3b82f6?text=Data+Deportiva",
            "pregunta": "¿Qué haces con esa información?",
            "opciones": [
                { "id": "A", "texto": "Crear un algoritmo predictivo para saber qué equipo tiene más probabilidad de ganar el mundial.", "valor_steam": "matematicas", "valor_riasec": "investigador", "habilidad_blanda": "modelado predictivo" },
                { "id": "B", "texto": "Crear infografías y visualizaciones de datos interactivas y hermosas para los fans.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "sintesis visual" },
                { "id": "C", "texto": "Desarrollar una app móvil súper rápida para que los usuarios consulten los datos en tiempo real.", "valor_steam": "tecnologia", "valor_riasec": "convencional", "habilidad_blanda": "desarrollo agil" },
                { "id": "D", "texto": "Analizar la biomecánica de las lesiones más comunes para ayudar a mejorar el rendimiento deportivo.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "analisis clinico" }
            ]
        },
        {
            "id": 6,
            "tema_etiqueta": "Salud e Innovación",
            "contexto": "Un hospital quiere mejorar la experiencia de los pacientes infantiles que le tienen miedo a las resonancias magnéticas.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/06b6d4?text=Hospital+Innovador",
            "pregunta": "¿Cuál es tu propuesta?",
            "opciones": [
                { "id": "A", "texto": "Diseñar una experiencia de Realidad Virtual que el niño vea mientras está en la máquina.", "valor_steam": "tecnologia", "valor_riasec": "investigador", "habilidad_blanda": "diseno de experiencias" },
                { "id": "B", "texto": "Estudiar la respuesta neurológica del miedo en los niños para crear protocolos relajantes.", "valor_steam": "ciencia", "valor_riasec": "social", "habilidad_blanda": "investigacion humana" },
                { "id": "C", "texto": "Pintar y rediseñar la máquina y la habitación para que parezcan una nave espacial.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "imaginacion ambiental" },
                { "id": "D", "texto": "Modificar la maquinaria interna para reducir los fuertes ruidos mecánicos sin perder precisión.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "optimizacion de hardware" }
            ]
        },
        {
            "id": 7,
            "tema_etiqueta": "Eventos Masivos",
            "contexto": "Hay que organizar un festival de música masivo de 3 días.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/d946ef?text=Festival+de+Musica",
            "pregunta": "¿En qué equipo prefieres trabajar?",
            "opciones": [
                { "id": "A", "texto": "En la ingeniería del sonido y acústica para que la música se escuche perfecta en todo el estadio.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "precision tecnica" },
                { "id": "B", "texto": "En la creación de las animaciones visuales y luces láser que acompañan a los DJs.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "sincronizacion creativa" },
                { "id": "C", "texto": "En la gestión del presupuesto, cálculo de aforo y proyecciones de ganancias y gastos.", "valor_steam": "matematicas", "valor_riasec": "convencional", "habilidad_blanda": "gestion de recursos" },
                { "id": "D", "texto": "En el desarrollo del sistema de pulseras RFID para pagos sin contacto de los asistentes.", "valor_steam": "tecnologia", "valor_riasec": "emprendedor", "habilidad_blanda": "implementacion de sistemas" }
            ]
        },
        {
            "id": 8,
            "tema_etiqueta": "Ingeniería Aeroespacial",
            "contexto": "Tu escuela va a lanzar un pequeño satélite tipo 'CanSat' (del tamaño de una lata) al espacio bajo.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/64748b?text=Lanzamiento+CanSat",
            "pregunta": "¿Qué componente te emociona más ensamblar?",
            "opciones": [
                { "id": "A", "texto": "El paracaídas y el sistema de recuperación mecánico para que aterrice a salvo.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "diseno a prueba de fallos" },
                { "id": "B", "texto": "Los sensores meteorológicos que medirán la presión, temperatura y radiación UV.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "recoleccion de datos" },
                { "id": "C", "texto": "El microcontrolador y el código para que los datos se transmitan a la base en tierra.", "valor_steam": "tecnologia", "valor_riasec": "convencional", "habilidad_blanda": "programacion embebida" },
                { "id": "D", "texto": "Diseñar la carcasa exterior para que sea ultraligera, aerodinámica y estéticamente única.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "diseno funcional" }
            ]
        },
        {
            "id": 9,
            "tema_etiqueta": "Producción Cinematográfica",
            "contexto": "Un director de cine te pide ayuda porque la película de ciencia ficción que grabó se ve aburrida.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/8b5cf6?text=Set+de+Filmacion",
            "pregunta": "¿Cómo decides intervenir para mejorarla?",
            "opciones": [
                { "id": "A", "texto": "Crear efectos especiales (CGI) increíbles para las explosiones y criaturas espaciales.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "vision artistica" },
                { "id": "B", "texto": "Asesorar al director sobre física cuántica real para que los viajes en el tiempo tengan sentido.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "rigor cientifico" },
                { "id": "C", "texto": "Optimizar el software de renderizado para que las computadoras procesen el video en la mitad de tiempo.", "valor_steam": "tecnologia", "valor_riasec": "convencional", "habilidad_blanda": "optimizacion de procesos" },
                { "id": "D", "texto": "Construir rigs y brazos robóticos para que las cámaras hagan movimientos súper complejos.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "mecanica aplicada" }
            ]
        },
        {
            "id": 10,
            "tema_etiqueta": "Biología y Naturaleza",
            "contexto": "Se descubre una nueva especie de planta en una selva remota y tienes la oportunidad de estudiarla.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/10b981?text=Selva+Remota",
            "pregunta": "¿Qué aspecto de la investigación eliges?",
            "opciones": [
                { "id": "A", "texto": "Secuenciar su ADN y estudiar si tiene propiedades medicinales no descubiertas.", "valor_steam": "ciencia", "valor_riasec": "investigador", "habilidad_blanda": "curiosidad cientifica" },
                { "id": "B", "texto": "Realizar ilustraciones botánicas súper detalladas para registrar su estructura para enciclopedias.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "observacion detallada" },
                { "id": "C", "texto": "Usar drones con cámaras térmicas para mapear exactamente en qué zonas de la selva crece.", "valor_steam": "tecnologia", "valor_riasec": "realista", "habilidad_blanda": "manejo de tecnologia de campo" },
                { "id": "D", "texto": "Crear un modelo matemático que explique los patrones geométricos en los que crecen sus hojas.", "valor_steam": "matematicas", "valor_riasec": "investigador", "habilidad_blanda": "abstraccion matematica" }
            ]
        },
        {
            "id": 11,
            "tema_etiqueta": "Urbanismo Inteligente",
            "contexto": "Tienes la misión de reducir el tráfico vehicular en una ciudad sobrepoblada.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/f43f5e?text=Ciudad+Inteligente",
            "pregunta": "¿Qué estrategia prefieres implementar?",
            "opciones": [
                { "id": "A", "texto": "Crear fórmulas y algoritmos que sincronicen los semáforos en tiempo real según el volumen de autos.", "valor_steam": "matematicas", "valor_riasec": "convencional", "habilidad_blanda": "pensamiento sistemico" },
                { "id": "B", "texto": "Rediseñar la estructura de los puentes y carreteras para soportar más peso y carriles adicionales.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "planificacion a gran escala" },
                { "id": "C", "texto": "Estudiar el impacto de la contaminación vehicular en la salud respiratoria de la población local.", "valor_steam": "ciencia", "valor_riasec": "social", "habilidad_blanda": "conciencia social" },
                { "id": "D", "texto": "Diseñar una campaña interactiva para fomentar el uso de bicicletas y transporte público.", "valor_steam": "arte", "valor_riasec": "emprendedor", "habilidad_blanda": "persuasion" }
            ]
        },
        {
            "id": 12,
            "tema_etiqueta": "Gestión de Crisis",
            "contexto": "El servidor del proyecto final de tu equipo se ha caído a pocas horas de la entrega y nadie sabe por qué.",
            "imagen_contexto_url": "https://placehold.co/800x400/1e293b/0f172a?text=Caida+del+Servidor",
            "pregunta": "¿Cuál es tu primer instinto para solucionar la crisis?",
            "opciones": [
                { "id": "A", "texto": "Abrir la consola, revisar los logs de errores y rastrear la falla lógica en el código.", "valor_steam": "tecnologia", "valor_riasec": "investigador", "habilidad_blanda": "diagnostico tecnico" },
                { "id": "B", "texto": "Diseñar rápidamente una pantalla de 'Mantenimiento' atractiva para no perder credibilidad.", "valor_steam": "arte", "valor_riasec": "artistico", "habilidad_blanda": "manejo de imagen publica" },
                { "id": "C", "texto": "Reorganizar al equipo, calcular el tiempo de inactividad y contactar al profesor con un plan B.", "valor_steam": "matematicas", "valor_riasec": "emprendedor", "habilidad_blanda": "liderazgo estrategico" },
                { "id": "D", "texto": "Revisar los cables, el router y la temperatura del hardware del servidor físico.", "valor_steam": "ingenieria", "valor_riasec": "realista", "habilidad_blanda": "inspeccion fisica" }
            ]
        }
    ];

    currentQuestionIndex: number = 0;
    selectedOptionId: string | null = null;
    profileScores: Record<string, number> = {
        ciencia: 0,
        tecnologia: 0,
        ingenieria: 0,
        arte: 0,
        matematicas: 0
    };

    showAlert: boolean = false;
    showExitModal: boolean = false;

    constructor(private router: Router) { }

    ngOnInit(): void { }

    startTest() {
        this.viewState = 'questionnaire';
        this.currentQuestionIndex = 0;
        this.selectedOptionId = null;
        this.resetScores();
    }

    resetScores() {
        this.profileScores = {
            ciencia: 0,
            tecnologia: 0,
            ingenieria: 0,
            arte: 0,
            matematicas: 0
        };
    }

    get currentQuestion(): Question {
        return this.questions[this.currentQuestionIndex];
    }

    get progressPercentage(): number {
        return ((this.currentQuestionIndex) / this.questions.length) * 100;
    }

    selectOption(optionId: string) {
        this.selectedOptionId = optionId;
        this.showAlert = false; // Hide alert if it was showing
    }

    nextQuestion() {
        if (!this.selectedOptionId) {
            this.showAlert = true;
            setTimeout(() => this.showAlert = false, 3000);
            return;
        }

        // Accumulate score
        const selectedOption = this.currentQuestion.opciones.find(o => o.id === this.selectedOptionId);
        if (selectedOption) {
            const tagKey = selectedOption.valor_steam.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (this.profileScores[tagKey] !== undefined) {
                this.profileScores[tagKey]++;
            }
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.selectedOptionId = null;
        } else {
            this.finishTest();
        }
    }

    finishTest() {
        this.viewState = 'analyzing';

        // Simulate API call and Analysis
        setTimeout(() => {
            // Save this score and navigate to results
            this.router.navigate(['/test-result']);
        }, 3000);
    }

    promptExit() {
        this.showExitModal = true;
    }

    cancelExit() {
        this.showExitModal = false;
    }

    confirmExit() {
        this.showExitModal = false;
        this.router.navigate(['/dashboard']);
    }
}
