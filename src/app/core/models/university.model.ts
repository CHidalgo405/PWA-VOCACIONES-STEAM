import { GeoPoint } from '@angular/fire/firestore';

export interface University {
  id?: string;
  name: string;
  location: GeoPoint;
  address: string;
  programs: string[];
  contactUrl?: string;
  logoUrl?: string;
}
