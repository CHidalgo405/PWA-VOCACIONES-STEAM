# 🚀 STEAM Vocations PWA: API & Backend Master Blueprint

Este documento es la especificación técnica maestra para la construcción del backend de la aplicación **STEAM Vocations PWA**. Está diseñado para que un desarrollador backend construya la API desde cero utilizando **NestJS, PostgreSQL y TypeORM**.

## 🛠 Stack Tecnológico Estricto
- **Framework:** NestJS (Node.js)
- **Base de Datos:** PostgreSQL
- **ORM:** TypeORM
- **Autenticación:** JWT (JSON Web Tokens) & Google OAuth 2.0
- **Integración IA:** API de Gemini (u otra IA compatible) para sugerencias de universidades.
- **Almacenamiento de Archivos:** AWS S3 o Cloudinary (para avatares de usuario).

---

## 1. 🗄️ Arquitectura de Base de Datos (TypeORM Entities)

El modelo de datos debe diseñarse para ser escalable, relacional y eficiente. A continuación, se definen las entidades principales.

### 1.1 `User` (Usuarios)
Almacena la información del estudiante o administrador.

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { VocationalTest } from './vocational-test.entity';
import { UserSettings } from './user-settings.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string; // Nullable porque los usuarios de Google OAuth no tienen password

  @Column()
  fullname: string;

  @Column({ type: 'enum', enum: ['student', 'admin'], default: 'student' })
  role: string;

  @Column({ nullable: true })
  avatarUrl?: string; // URL de S3 o Cloudinary

  @Column({ default: 'Explorador STEAM' })
  title: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  googleId?: string; 

  @OneToOne(() => UserSettings, settings => settings.user, { cascade: true })
  settings: UserSettings;

  @OneToMany(() => VocationalTest, test => test.user)
  tests: VocationalTest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 1.2 `OtpCode` (Códigos de Verificación)
Para manejar el registro y recuperación de contraseña. Se guardan temporalmente.

```typescript
@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string; // Ej. "123456"

  @Column({ type: 'enum', enum: ['register', 'recovery'] })
  purpose: string;

  @Column()
  expiresAt: Date; // Usualmente Date.now() + 15 mins

  @CreateDateColumn()
  createdAt: Date;
}
```

### 1.3 `VocationalTest` (Intentos del Test)
Guarda el resultado consolidado del test una vez finalizado. **Nota:** Dado que el frontend permite "ir hacia atrás" en las preguntas, y por eficiencia, **las respuestas se mandan completas al final del test en un solo bloque**.

```typescript
@Entity('vocational_tests')
export class VocationalTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.tests)
  user: User;

  @Column({ type: 'jsonb' })
  answers: any; // { "questionId": "optionId", "1": "A", "2": "C" }

  @Column({ type: 'jsonb' })
  profileScores: any; // { ciencia: 4, tecnologia: 5, ingenieria: 1, arte: 0, matematicas: 2 }

  @Column()
  dominantTraits: string; // Ej. "Tecnología + Ciencia"

  @OneToOne(() => AiRecommendation, rec => rec.test, { cascade: true })
  recommendation: AiRecommendation;

  @CreateDateColumn()
  completedAt: Date;
}
```

### 1.4 `AiRecommendation` (Universidades devueltas)
Guarda la respuesta estructurada de la IA para un test específico.

```typescript
@Entity('ai_recommendations')
export class AiRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => VocationalTest, test => test.recommendation)
  @JoinColumn()
  test: VocationalTest;

  @Column()
  locationInput: string; // Ej. "Veracruz"

  @Column({ type: 'jsonb' })
  universities: any; // Array de objetos con { name, location, suggestedMajor, matchReason, etc. }

  @Column({ type: 'text' })
  aiGeneralAdvice: string; // El párrafo descriptivo ('description' en el frontend)
}
```

### 1.5 `UserSettings` (Ajustes y Preferencias)
```typescript
@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.settings)
  @JoinColumn()
  user: User;

  @Column({ default: false })
  darkMode: boolean;

  @Column({ default: 'Español' })
  language: string;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ default: false })
  emailMarketing: boolean;
}
```

---

## 2. 📁 Módulos y Estructura en NestJS

La arquitectura debe seguir principios de Domain-Driven Design (DDD) separados por módulos ("Feature Modules").

```text
src/
├── app.module.ts
├── common/                 # Excepciones, interceptores, filtros globales
├── config/                 # Configuración de env variables (TypeORM, JWT, IAM)
├── core/
│   ├── auth/               # AuthModule: Login, Register, OTP, Google Auth, JWT Guards
│   │   ├── dto/
│   │   ├── guards/         # jwt-auth.guard.ts, roles.guard.ts
│   │   ├── decorators/     # current-user.decorator.ts, roles.decorator.ts
│   │   ├── strategies/     # jwt.strategy.ts, google.strategy.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
├── modules/
│   ├── users/              # UsersModule: Perfil, Ajustes, Avatar
│   ├── tests/              # TestModule: Lógica del test vocacional, Scoring
│   ├── ai/                 # AiModule: Integración con Gemini, Prompts
│   └── mail/               # MailModule: Envío de correos OTP (Nodemailer o Resend)
```

---

## 3. 🛡️ Autenticación y Seguridad (JWT & SSO)

### 3.1 Flujo OTP (Registro y Recuperación)
El frontend ya no enviará correos directamente mediante EmailJS, este es trabajo del backend por seguridad.
1. **Petición de OTP:** Frontend manda `POST /auth/send-otp` con `email` y `purpose=('register'|'recovery')`.
2. **Generación:** El backend genera un código de 6 dígitos, lo guarda en PostgreSQL (`OtpCode`) hasheado o en texto plano con un `expiresAt` de 15 minutos, y envía el correo mediante `MailModule` (Ej: Nodemailer + SendGrid/AWS SES).
3. **Validación:** Frontend manda `POST /auth/verify-otp`. Backend busca el código en BD. Si es válido y no expiró, lo elimina y devuelve un JWT de acceso temporal o marca el `isEmailVerified` a `true`.

### 3.2 Login con Google (OAuth 2.0)
Utilizar `@nestjs/passport` y `passport-google-oauth20`.
- El frontend redirige a `GET /auth/google`.
- Google devuelve la llamada a `GET /auth/google/callback`.
- El `GoogleStrategy` extrae el `email`, `fullname` y `avatarUrl`.
- Si el usuario existe en BD, genera JWT. Si no existe, lo crea automáticamente sin password y con `isEmailVerified = true` y genera JWT.
- Redirige al frontend con el token (Ej: `https://steamvocations.app/oauth-callback?token=eyJhbG...`).

### 3.3 Guards y Decoradores
**JwtAuthGuard**:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**CurrentUser Decorator** (para inyectar el usuario en el controller):
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```
Uso en controladores: `@CurrentUser() user: User`

---

## 4. 🚏 Detalle Exhaustivo de Endpoints (Controladores)

### A. Autenticación (`AuthController`)

#### 1. POST `/api/v1/auth/register`
- **Propósito:** Registrar un nuevo usuario e iniciar el proceso de OTP.
- **Request Payload:**
```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  fullname: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```
- **Response:** `201 Created` - `{ "message": "User created. OTP sent to email." }`

#### 2. POST `/api/v1/auth/verify-otp`
- **Propósito:** Validar OTP y devolver los tokens finales.
- **Request Payload:**
```typescript
export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsEnum(['register', 'recovery'])
  purpose: string;
}
```
- **Response (200 OK):** `{ "accessToken": "eyJhb...", "user": { ... } }`

#### 3. POST `/api/v1/auth/login`
- **Request Payload:** `{ email, password }`
- **Response:** Devuelve `accessToken` y datos del usuario.

### B. Pruebas y Resultados (`TestController`)

#### 4. POST `/api/v1/tests/submit`
- **Propósito:** Recibe todas las respuestas del test de golpe, calcula puntajes usando el STEAM Algorithm y genera las recomendaciones con IA. Consumido al terminar las 12 preguntas de la pantalla `vocation-test`.
- **Guards:** `@UseGuards(JwtAuthGuard)`
- **Request Payload:**
```typescript
export class SubmitTestDto {
  @IsObject()
  answers: Record<string, string>; // Ej: { "1": "A", "2": "C", ... }

  @IsString()
  @IsOptional()
  locationInput?: string; // Ej: "Veracruz, México"
}
```
- **Response (201 Created):**
```json
{
  "testId": "uuid-1234",
  "scores": {
    "ciencia": 4,
    "tecnologia": 5,
    "ingenieria": 1,
    "arte": 0,
    "matematicas": 2
  },
  "dominantTraits": "Tecnología + Ciencia",
  "aiProfileDescription": "Eres un investigador nato con fuerte inclinación...",
  "recommendations": [
    {
      "name": "Universidad Veracruzana",
      "location": "Xalapa",
      "suggestedMajor": "Ing. de Software",
      "matchReason": "Combina tu pasión por la tecnología...",
      "keyDates": "Febrero 2026",
      "studyPlan": ["Ciberseguridad", "Redes"],
      "websiteUrl": "https://www.uv.mx"
    }
  ]
}
```

### C. Usuarios (`UsersController`)

#### 5. GET `/api/v1/users/profile`
- **Propósito:** Obtener datos para la vista del Dashboard y Perfil.
- **Response:** Retorna `User`, junto con los `Settings`, el radar chart base de su último test, y las insignias (badges) calculadas sobre la marcha.

#### 6. PUT `/api/v1/users/avatar`
- **Propósito:** Actualizar foto de perfil.
- **Implementación:** Usar `FileInterceptor` de NestJS. Recibir el `multipart/form-data`, subir el buffer del archivo a AWS S3 o Cloudinary a través de un `UploadService`, obtener la URL pública y guardarla en el campo `avatarUrl` del usuario.

---

## 5. 🧠 Lógica de Negocio Central (Servicios)

### 5.1 El Algoritmo STEAM (`TestService`)

El frontend usa preguntas de 4 opciones (A, B, C, D), cada una ligada a una variable STEAM (ej. `ciencia`, `tecnologia`, etc.).
Cuando llega el payload: `{ "1": "A", "2": "C" }`
1. El backend (opcionalmente) verifica en la BD a qué variable STEAM equivale la opción "A" de la pregunta "1". (O si se confía en el cliente, el front puede mandar de una vez el arreglo sumado, pero lo ideal es calcularlo en backend).
2. Se inician 5 contadores: `C=0, T=0, E=0, A=0, M=0`.
3. Se itera el DTO recibido. Si la pregunta 1 fue "tecnologia", `T++`.
4. Se obtienen los 1 o 2 valores más altos para determinar los `dominantTraits` (Ej. Si T=5 y C=4 -> "Tecnología + Ciencia").

### 5.2 Integración con IA Gemini (`AiService`)

Una vez que el `TestService` tiene los puntajes y el `locationInput`, llama al `AiService`:

1. **Construcción del Prompt:**
   ```javascript
   const prompt = `
   Actúa como un orientador vocacional experto. Tengo un estudiante en "${locationInput || 'México'}".
   Sus fortalezas en el modelo STEAM son:
   Ciencia: ${scores.ciencia}/12
   Tecnología: ${scores.tecnologia}/12
   Ingeniería: ${scores.ingenieria}/12
   Arte: ${scores.arte}/12
   Matemáticas: ${scores.matematicas}/12

   Genera un JSON estrictamente con la siguiente estructura (NO markdown, SOLO JSON válido):
   {
     "description": "Una breve descripción de 3 líneas sobre el perfil del alumno y por qué encaja en estas áreas.",
     "universities": [
       {
         "name": "Nombre de la universidad real en esa región",
         "location": "Ciudad, Estado",
         "suggestedMajor": "Carrera exacta sugerida",
         "matchReason": "Razón corta de por qué hace match con su perfil",
         "keyDates": "Fechas estimadas de admisión",
         "studyPlan": ["Materia 1", "Materia 2", "Materia 3"],
         "websiteUrl": "URL real de la universidad"
       }
       // Máximo 3 universidades
     ]
   }
   `;
   ```
2. **Llamada a API Externa:** Usar la librería oficial de `@google/generative-ai` o HTTP `axios`. Solicitar explícitamente `response_mime_type: "application/json"`.
3. **Parseo y Persistencia:** Hacer un `JSON.parse()` del texto devuelto. Guardar los resultados en la tabla `AiRecommendation` asociada al intento de `VocationalTest`.
4. Devolver la data consolidada al Controlador.

---

## 6. ⚙️ Optimizaciones y Buenas Prácticas Requeridas

1. **Validaciones Estrictas:** Usa `class-validator` en todos los DTOs para evitar inyección SQL o datos corruptos. `@IsString()`, `@IsEmail()`, `@IsOptional()`.
2. **Manejo de CORS:** Habilita CORS en `main.ts` con el dominio del frontend PWA y `localhost:4200` y permite cabeceras `Authorization`.
3. **Paginación:** Si se desarrolla un panel de administrador (para ver todos los tests), endpoints como `GET /api/v1/admin/tests` deben incluir `@Query('page')` y `@Query('limit')`.
4. **Manejo de Errores IA:** Si la API de Gemini falla o demora más de la cuenta, implementar un filtro de fallback usando un bloque `try/catch` que devuelva opciones "genéricas" precargadas en base de datos para no bloquear la experiencia del usuario de la PWA.
