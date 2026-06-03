import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { University } from '../models/university.model';

@Injectable({
  providedIn: 'root'
})
export class UniversityService {
  private firestore: Firestore = inject(Firestore);

  /**
   * Obtiene la lista de universidades desde la colección 'universities'
   */
  getUniversities(): Observable<University[]> {
    const universitiesCollection = collection(this.firestore, 'universities');
    // collectionData extrae los datos y opcionalmente añade el ID del documento
    return collectionData(universitiesCollection, { idField: 'id' }) as Observable<University[]>;
  }
}
