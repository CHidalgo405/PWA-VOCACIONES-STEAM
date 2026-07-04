import { Observable, forkJoin, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Garantiza que un observable de carga (p. ej. una petición HTTP) tarde al
 * menos `minMs` en resolverse. Sin esto, en una API rápida el estado de
 * carga (skeleton/shimmer) puede resolverse en unos pocos milisegundos —
 * técnicamente correcto, pero imperceptible para el usuario, dando la
 * sensación de que el skeleton "nunca aparece". Los errores no esperan:
 * se propagan de inmediato para no demorar el feedback de un fallo real.
 */
export function withMinDuration<T>(source$: Observable<T>, minMs: number = 400): Observable<T> {
  return forkJoin([source$, timer(minMs)]).pipe(map(([result]) => result));
}
