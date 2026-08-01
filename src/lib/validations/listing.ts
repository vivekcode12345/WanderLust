import { z } from "zod";

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must not exceed 100 characters"),
  
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  
  address: z
    .string()
    .min(5, "Address is required")
    .max(200, "Address must not exceed 200 characters"),
  
  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City must not exceed 100 characters"),
  
  state: z
    .string()
    .max(100, "State must not exceed 100 characters")
    .optional(),
  
  country: z
    .string()
    .min(2, "Country is required")
    .max(100, "Country must not exceed 100 characters"),
  
  postalCode: z
    .string()
    .max(20, "Postal code must not exceed 20 characters")
    .optional(),
  
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(1000000, "Price must not exceed 1,000,000"),
  
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code (e.g., USD, EUR)")
    .default("USD"),
  
  maxGuests: z
    .number()
    .int("Guests must be a whole number")
    .min(1, "At least 1 guest is required")
    .max(20, "Maximum 20 guests allowed"),
  
  bedrooms: z
    .number()
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative")
    .max(20, "Maximum 20 bedrooms allowed"),
  
  beds: z
    .number()
    .int("Beds must be a whole number")
    .min(1, "At least 1 bed is required")
    .max(20, "Maximum 20 beds allowed"),
  
  bathrooms: z
    .number()
    .int("Bathrooms must be a whole number")
    .min(0, "Bathrooms cannot be negative")
    .max(10, "Maximum 10 bathrooms allowed"),
  
  categoryId: z.string().uuid("Invalid category ID"),
  
  amenityIds: z.array(z.string().uuid()).optional().default([]),
  
  images: z
    .array(z.object({
      url: z.string().url(),
      publicId: z.string(),
      alt: z.string().optional(),
      isPrimary: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
    }))
    .min(1, "At least 1 image is required")
    .max(20, "Maximum 20 images allowed"),
});

export const updateListingSchema = createListingSchema.partial().extend({
  id: z.string().uuid("Invalid listing ID"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const listingQuerySchema = z.object({
  keyword: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  guests: z.coerce.number().int().positive().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;