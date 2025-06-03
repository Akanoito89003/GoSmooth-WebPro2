export interface Place {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  location: string;
  description: string;
  longDescription?: string;
  coverImage: string;
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
  hours?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export interface Review {
  id: string;
  user_id: string;
  username?: string;
  place_id: string;
  place_name?: string;
  rating: number;
  comment: string;
  likes: number;
  liked_by?: string[];
  createdAt?: string;
  updatedAt?: string;
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