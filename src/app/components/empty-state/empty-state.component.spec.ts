import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Sin resultados');
    fixture.componentRef.setInput('description', 'Prueba con otros filtros.');
    fixture.detectChanges();
  });

  it('muestra un título y una explicación accionable', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent).toContain('Sin resultados');
    expect(element.querySelector('p')?.textContent).toContain('Prueba con otros filtros.');
  });

  it('emite la acción principal cuando utiliza un botón', () => {
    const emit = spyOn(component.primaryAction, 'emit');
    fixture.componentRef.setInput('primaryLabel', 'Intentar de nuevo');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button.primary') as HTMLButtonElement;
    button.click();

    expect(emit).toHaveBeenCalled();
  });
});
