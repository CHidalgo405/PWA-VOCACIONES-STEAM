import { trigger, transition, style, query, animate } from '@angular/animations';

export const fadeSlideAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ transform: 'translateY(-10px)', opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      animate('200ms ease-out', style({ transform: 'translateY(10px)', opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
    ], { optional: true })
  ])
]);
