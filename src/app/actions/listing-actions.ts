"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  createListingSchema,
  updateListingSchema,
  listingQuerySchema,
} from "@/lib/validations/listing";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import {
  canCreateListing,
  canEditListing,
  canDeleteListing,
  canPublishListing,
  canManageImages,
} from "@/lib/authorization";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "@/lib/errors";
import { cache } from "react";

// ============================================
// TYPES
// ============================================

export type ListingWithDetails = Prisma.ListingGetPayload<{
  include: {
    host: {
      select: {
        id: true;
        username: true;
        firstName: true;
        lastName: true;
        avatar: true;
      };
    };
    category: true;
    images: {
      orderBy: { sortOrder: "asc" };
    };
    amenities: {
      include: {
        amenity: true;
      };
    };
    _count: {
      select: {
        reviews: true;
        bookings: true;
      };
    };
  };
}>;

export type ListingCardData = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  averageRating: number;
  reviewCount: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  host: {
    username: string;
    avatar?: string;
  };
  category: {
    name: string;
    slug: string;
  };
};

// ============================================
// CACHED QUERIES (for Server Components)
// ============================================

export const getListingById = cache(
  async (id: string): Promise<ListingWithDetails | null> => {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id, deletedAt: null },
        include: {
          host: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          category: true,
          images: {
            orderBy: { sortOrder: "asc" },
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
      });

      return listing;
    } catch (error) {
      console.error("Error fetching listing:", error);
      return null;
    }
  }
);

export const getListings = cache(
  async (query: z.infer<typeof listingQuerySchema>): Promise<{
    listings: ListingCardData[];
    nextCursor?: string;
    hasMore: boolean;
  }> => {
    try {
      const {
        keyword,
        categoryId,
        city,
        country,
        minPrice,
        maxPrice,
        guests,
        cursor,
        limit = 20,
      } = query;

      const where: Prisma.ListingWhereInput = {
        deletedAt: null,
        isActive: true,
        ...(keyword && {
          OR: [
            { title: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { address: { contains: keyword, mode: "insensitive" } },
            { city: { contains: keyword, mode: "insensitive" } },
          ],
        }),
        ...(categoryId && { categoryId }),
        ...(city && { city: { contains: city, mode: "insensitive" } }),
        ...(country && { country: { contains: country, mode: "insensitive" } }),
        ...(minPrice && { price: { gte: minPrice } }),
        ...(maxPrice && { price: { lte: maxPrice } }),
        ...(guests && { maxGuests: { gte: guests } }),
      };

      const listings = await prisma.listing.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          city: true,
          country: true,
          averageRating: true,
          reviewCount: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: {
              url: true,
              isPrimary: true,
            },
          },
          host: {
            select: {
              username: true,
              avatar: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const hasMore = listings.length > limit;
      const data = hasMore ? listings.slice(0, -1) : listings;
      const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

      return {
        listings: data as ListingCardData[],
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error("Error fetching listings:", error);
      return {
        listings: [],
        hasMore: false,
      };
    }
  }
);

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new listing
 */
export async function createListing(
  data: z.infer<typeof createListingSchema>
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new UnauthorizedError("You must be logged in to create a listing");
    }

    if (!canCreateListing(user)) {
      throw new ForbiddenError("Only hosts can create listings");
    }

    // Validate input
    const validatedData = createListingSchema.parse(data);

    // Create listing with images in a transaction
    const listing = await prisma.$transaction(async (tx: any) => {
      // Create listing
      const newListing = await tx.listing.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          postalCode: validatedData.postalCode,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          price: validatedData.price,
          currency: validatedData.currency,
          maxGuests: validatedData.maxGuests,
          bedrooms: validatedData.bedrooms,
          beds: validatedData.beds,
          bathrooms: validatedData.bathrooms,
          hostId: user.id,
          categoryId: validatedData.categoryId,
          images: {
            create: validatedData.images.map((img, index) => ({
              url: img.url,
              publicId: img.publicId,
              alt: img.alt,
              isPrimary: img.isPrimary || index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          },
        },
        include: {
          images: true,
        },
      });

      // Create listing-amenity relationships
      if (validatedData.amenityIds.length > 0) {
        await tx.listingAmenity.createMany({
          data: validatedData.amenityIds.map((amenityId) => ({
            listingId: newListing.id,
            amenityId,
          })),
        });
      }

      return newListing;
    });

    // Revalidate cache
    revalidatePath("/listings");
    revalidatePath(`/listings/${listing.id}`);

    return {
      success: true,
      listingId: listing.id,
    };
  } catch (error) {
    console.error("Error creating listing:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create listing",
    };
  }
}

/**
 * Update a listing
 */
export async function updateListing(
  data: z.infer<typeof updateListingSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to update a listing");
    }

    // Validate input
    const validatedData = updateListingSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // Fetch existing listing
    const existingListing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canEditListing(user, existingListing)) {
      throw new ForbiddenError("You are not authorized to edit this listing");
    }

    // Update listing
    await prisma.$transaction(async (tx: any) => {
      // Update listing fields
      await tx.listing.update({
        where: { id },
        data: {
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.address && { address: updateData.address }),
          ...(updateData.city && { city: updateData.city }),
          ...(updateData.state && { state: updateData.state }),
          ...(updateData.country && { country: updateData.country }),
          ...(updateData.postalCode && { postalCode: updateData.postalCode }),
          ...(updateData.latitude && { latitude: updateData.latitude }),
          ...(updateData.longitude && { longitude: updateData.longitude }),
          ...(updateData.price && { price: updateData.price }),
          ...(updateData.currency && { currency: updateData.currency }),
          ...(updateData.maxGuests && { maxGuests: updateData.maxGuests }),
          ...(updateData.bedrooms && { bedrooms: updateData.bedrooms }),
          ...(updateData.beds && { beds: updateData.beds }),
          ...(updateData.bathrooms && { bathrooms: updateData.bathrooms }),
          ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
          ...(updateData.isFeatured !== undefined && { isFeatured: updateData.isFeatured }),
        },
      });

      // Update amenities if provided
      if (updateData.amenityIds) {
        // Delete existing amenities
        await tx.listingAmenity.deleteMany({
          where: { listingId: id },
        });

        // Create new amenities
        await tx.listingAmenity.createMany({
          data: updateData.amenityIds.map((amenityId) => ({
            listingId: id,
            amenityId,
          })),
        });
      }
    });

    // Revalidate cache
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating listing:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to update listing",
    };
  }
}

/**
 * Soft delete a listing
 */
export async function deleteListing(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to delete a listing");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization (only admin can delete)
    if (!canDeleteListing(user)) {
      throw new ForbiddenError("Only admins can delete listings");
    }

    // Soft delete
    await prisma.listing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Revalidate cache
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting listing:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to delete listing",
    };
  }
}

/**
 * Restore a soft-deleted listing
 */
export async function restoreListing(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to restore a listing");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canEditListing(user, listing)) {
      throw new ForbiddenError("You are not authorized to restore this listing");
    }

    // Restore listing
    await prisma.listing.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });

    // Revalidate cache
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error restoring listing:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to restore listing",
    };
  }
}

/**
 * Publish/Unpublish a listing
 */
export async function toggleListingPublish(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to publish/unpublish a listing");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canPublishListing(user, listing)) {
      throw new ForbiddenError("You are not authorized to publish/unpublish this listing");
    }

    // Update listing
    await prisma.listing.update({
      where: { id },
      data: { isActive },
    });

    // Revalidate cache
    revalidatePath("/listings");
    revalidatePath(`/listings/${id}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling listing publish:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to update listing status",
    };
  }
}

/**
 * Upload images for a listing
 */
export async function uploadListingImages(
  listingId: string,
  files: File[]
): Promise<{ success: boolean; images?: Array<{url: string; publicId: string; alt: string; isPrimary: boolean; sortOrder: number}>; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to upload images");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canManageImages(user, listing)) {
      throw new ForbiddenError("You are not authorized to manage images for this listing");
    }

    // Get current image count
    const currentImages = await prisma.listingImage.count({
      where: { listingId },
    });

    if (currentImages + files.length > 20) {
      throw new ValidationError("Maximum 20 images allowed per listing");
    }

    // Upload images to Cloudinary
    const uploadPromises = files.map(async (file, index) => {
      const result = await uploadImage(file, {
        folder: `wanderlust/listings/${listingId}`,
        publicId: `${listingId}-${Date.now()}-${index}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        alt: file.name,
        isPrimary: currentImages === 0 && index === 0,
        sortOrder: currentImages + index,
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Save to database
    await prisma.listingImage.createMany({
      data: uploadedImages.map((img) => ({
        listingId,
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
    });

    // Revalidate cache
    revalidatePath(`/listings/${listingId}`);

    return {
      success: true,
      images: uploadedImages,
    };
  } catch (error) {
    console.error("Error uploading images:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to upload images",
    };
  }
}

/**
 * Delete an image from a listing
 */
export async function deleteListingImage(
  listingId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to delete images");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canManageImages(user, listing)) {
      throw new ForbiddenError("You are not authorized to manage images for this listing");
    }

    // Fetch image
    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundError("Image not found");
    }

    // Delete from Cloudinary
    await deleteImage(image.publicId);

    // Delete from database
    await prisma.listingImage.delete({
      where: { id: imageId },
    });

    // Revalidate cache
    revalidatePath(`/listings/${listingId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting image:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to delete image",
    };
  }
}

/**
 * Set primary image for a listing
 */
export async function setPrimaryImage(
  listingId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to manage images");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canManageImages(user, listing)) {
      throw new ForbiddenError("You are not authorized to manage images for this listing");
    }

    // Update images in transaction
    await prisma.$transaction([
      // Remove primary flag from all images
      prisma.listingImage.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      }),
      // Set new primary image
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    // Revalidate cache
    revalidatePath(`/listings/${listingId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error setting primary image:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to set primary image",
    };
  }
}

/**
 * Reorder listing images
 */
export async function reorderListingImages(
  listingId: string,
  imageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError("You must be logged in to reorder images");
    }

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Check authorization
    if (!canManageImages(user, listing)) {
      throw new ForbiddenError("You are not authorized to manage images for this listing");
    }

    // Update sort order
    await prisma.$transaction(
      imageIds.map((imageId, index) =>
        prisma.listingImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        })
      )
    );

    // Revalidate cache
    revalidatePath(`/listings/${listingId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error reordering images:", error);

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to reorder images",
    };
  }
}