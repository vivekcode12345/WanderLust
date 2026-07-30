import { env } from "@/env";

export const APP_NAME = "WanderLust";
export const APP_URL = env.NEXT_PUBLIC_APP_URL;
export const API_URL = env.NEXT_PUBLIC_API_URL;

export const ROUTES = {
  HOME: "/",
  LISTINGS: "/listings",
  LISTING_DETAIL: (id: string) => `/listings/${id}`,
  BOOKING: (id: string) => `/listings/${id}/book`,
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
  DASHBOARD: "/dashboard",
  MY_BOOKINGS: "/bookings/me",
  MANAGE_BOOKINGS: "/bookings/manage",
  FAVORITES: "/favorites",
  ADMIN_LISTINGS_NEW: "/admin/listings/new",
  ADMIN_LISTINGS_EDIT: (id: string) => `/admin/listings/${id}/edit`,
} as const;

export const LISTING_CATEGORIES = [
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Amazing Pools",
  "Camping",
  "Farms",
  "Arctic",
  "Domes",
  "Boats",
] as const;

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
} as const;

export const PAGINATION = {
  LISTINGS_PER_PAGE: 20,
  REVIEWS_PER_PAGE: 10,
  BOOKINGS_PER_PAGE: 20,
} as const;