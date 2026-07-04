# SteamVocationPwa

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Seguridad: API Key de Google Maps

La clave `googleMapsApiKey` de `src/environments/environment.ts` es una **clave de navegador**: viaja al cliente por diseño (Maps JavaScript API lo requiere). Su protección NO es ocultarla, sino **restringirla en Google Cloud Console**. Sin restricciones, cualquiera puede copiarla y facturar peticiones de Places a tu cuenta.

### Pasos obligatorios (Google Cloud Console)

1. Entrar a [console.cloud.google.com](https://console.cloud.google.com) → proyecto **vocaciones-steam** → **APIs y servicios → Credenciales**.
2. Abrir la API key usada por la PWA y configurar:
   - **Restricciones de aplicación** → *Sitios web* (referrers HTTP), con la lista:
     - `https://TU-DOMINIO-DE-VERCEL.vercel.app/*` (y el dominio propio si existe)
     - `http://localhost:4200/*` (desarrollo)
   - **Restricciones de API** → *Restringir clave* y marcar SOLO:
     - Maps JavaScript API
     - Places API (New)
3. Guardar. Los cambios tardan ~5 minutos en aplicar.

### Rotación (recomendada)

La clave anterior vivió en scripts del repositorio y permanece en el historial de git. Aunque la restricción por referrer la vuelve inutilizable fuera del dominio, lo más limpio es rotarla:

1. En Credenciales → **Crear credenciales → Clave de API**, aplicar las mismas restricciones del paso 2.
2. Reemplazar el valor en `src/environments/environment.ts` y `environment.development.ts`.
3. Eliminar la clave antigua en la consola.

> Nota: en Cloud Console → **Facturación → Presupuestos y alertas** conviene crear una alerta (p. ej. $10 USD/mes) para detectar abuso de la clave a tiempo.
