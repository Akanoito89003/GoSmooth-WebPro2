export interface Place {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  location: string;
  description: string;
  longDescription?: string;
  imageUrl: string[];
  gallery?: string[];
  rating: number;
  priceLevel: number;
  category: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  tags: string[];
  contact: {
    phone: string;
    website: string;
    hours: string;
    address: string;
  };
  highlights: string[];
  reviews: Review[];
  nearbyPlaces: NearbyPlace[];
}

export interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
  rating: number;
  comment: string;
  date: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
}

export interface PlaceFormData {
  name: string;
  location: string;
  description: string;
  category: string;
  priceLevel: number;
  imageUrl: string[];
  tags: string[];
} 