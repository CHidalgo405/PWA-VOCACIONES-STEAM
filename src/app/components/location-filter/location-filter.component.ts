import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-location-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconComponent],
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss']
})
export class LocationFilterComponent {
  location = signal('');
  
  @Output() locationChanged = new EventEmitter<string>();

  applyLocation() {
    if (this.location().trim() !== '') {
      this.locationChanged.emit(this.location().trim());
    }
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.applyLocation();
    }
  }
}
