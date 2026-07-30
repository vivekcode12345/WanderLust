export interface User {
  _id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  favorites: string[];
  createdAt?: Date;
}

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  country: string;
  category: string;
  image?: {
    url: string;
    filename: string;
  };
  owner: string | User;
  reviews: string[];
  geometry?: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
}

export interface Booking {
  _id: string;
  listing: string | Listing;
  guest: string | User;
  host: string | User;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  totalNights: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: Date;
}

export interface Review {
  _id: string;
  comment: string;
  rating: number;
  author: string | User;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}