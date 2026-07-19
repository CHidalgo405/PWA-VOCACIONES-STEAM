import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EMPTY } from 'rxjs';

const swUpdateStub = {
  isEnabled: false,
  versionUpdates: EMPTY,
  unrecoverable: EMPTY,
  checkForUpdate: () => Promise.resolve(false),
  activateUpdate: () => Promise.resolve(false),
};

/**
 * Dependencias de infraestructura que la aplicación registra en app.config.
 * Los componentes siguen usando sus servicios reales, pero HTTP queda
 * interceptado por el backend de pruebas y el Service Worker permanece inerte.
 */
export function provideAppTestDependencies(): Array<
  Provider | EnvironmentProviders
> {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    provideNoopAnimations(),
    { provide: SwUpdate, useValue: swUpdateStub },
  ];
}
