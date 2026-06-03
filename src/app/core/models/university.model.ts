export interface University {
  id?: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  programs?: string[];
  contactUrl?: string;
  logoUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  isOpen?: boolean;
}
