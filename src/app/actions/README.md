# WanderLust 2.0 - Listing Management Module

## Overview

Production-grade Listing Management module built with Next.js 16 Server Actions, Prisma ORM, and Cloudinary integration.

## Architecture

### Folder Structure

```
src/
├── app/
│   └── actions/
│       ├── listing-actions.ts    # All listing Server Actions
│       └── README.md            # This file
├── lib/
│   ├── validations/
│   │   └── listing.ts           # Zod schemas for listings
│   ├── cloudinary.ts            # Cloudinary integration
│   ├── authorization.ts          # Authorization helpers
│   ├── errors.ts                # Error handling utilities
│   ├── prisma.ts                # Prisma client singleton
│   └── auth.ts                  # Authentication utilities
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Server Actions

### Listing CRUD

#### `createListing(data)`
Create a new listing with images and amenities.

**Authorization:** HOST or ADMIN only

**Input:**
```typescript
{
  title: string (5-100 chars)
  description: string (20-5000 chars)
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  latitude: number (-90 to 90)
  longitude: number (-180 to 180)
  price: number (> 0, max 1,000,000)
  currency: string (3-letter code)
  maxGuests: number (1-20)
  bedrooms: number (0-20)
  beds: number (1-20)
  bathrooms: number (0-10)
  categoryId: string (UUID)
  amenityIds?: string[] (UUIDs)
  images: Array<{
    url: string
    publicId: string
    alt?: string
    isPrimary?: boolean
    sortOrder?: number
  }> (1-20 images)
}
```

**Returns:**
```typescript
{
  success: boolean
  listingId?: string
  error?: string
}
```

**Features:**
- Validates all input with Zod
- Creates listing and images in a single transaction
- Creates listing-amenity relationships
- Revalidates cache for listings pages

---

#### `updateListing(data)`
Update an existing listing.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  id: string (UUID)
  // Optional fields from createListing
  isActive?: boolean
  isFeatured?: boolean
}
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Partial update (only provided fields are updated)
- Updates amenities if provided
- Revalidates cache

---

#### `deleteListing(id)`
Soft delete a listing.

**Authorization:** ADMIN only

**Input:**
```typescript
string (listing UUID)
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Soft delete (sets `deletedAt` and `isActive: false`)
- Preserves data for analytics
- Revalidates cache

---

#### `restoreListing(id)`
Restore a soft-deleted listing.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
string (listing UUID)
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Clears `deletedAt` and sets `isActive: true`
- Revalidates cache

---

#### `toggleListingPublish(id, isActive)`
Publish or unpublish a listing.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  id: string (UUID)
  isActive: boolean
}
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Controls listing visibility
- Revalidates cache

---

### Image Management

#### `uploadListingImages(listingId, files)`
Upload multiple images to a listing.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  listingId: string (UUID)
  files: File[] (1-20 files, max 20 total images)
}
```

**Returns:**
```typescript
{
  success: boolean
  images?: Array<{
    url: string
    publicId: string
    alt: string
    isPrimary: boolean
    sortOrder: number
  }>
  error?: string
}
```

**Features:**
- Uploads to Cloudinary with optimization
- Creates multiple versions (400px, 800px, 1200px)
- Auto-formats to WebP/AVIF
- Sets first image as primary if none exists
- Revalidates cache

---

#### `deleteListingImage(listingId, imageId)`
Delete an image from a listing.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  listingId: string (UUID)
  imageId: string (UUID)
}
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Deletes from Cloudinary
- Deletes from database
- Revalidates cache

---

#### `setPrimaryImage(listingId, imageId)`
Set an image as the primary/cover image.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  listingId: string (UUID)
  imageId: string (UUID)
}
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Removes primary flag from all images
- Sets new primary image
- Uses transaction for consistency
- Revalidates cache

---

#### `reorderListingImages(listingId, imageIds)`
Reorder listing images.

**Authorization:** Listing owner or ADMIN only

**Input:**
```typescript
{
  listingId: string (UUID)
  imageIds: string[] (array of image UUIDs in desired order)
}
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Features:**
- Updates `sortOrder` for all images
- Uses transaction for consistency
- Revalidates cache

---

### Cached Queries (Server Components)

#### `getListingById(id)`
Fetch a single listing with all details.

**Returns:**
```typescript
ListingWithDetails | null
```

**Includes:**
- Host information
- Category
- All images (ordered by sortOrder)
- Amenities with details
- Review and booking counts

**Caching:** Uses React `cache()` for automatic deduplication

---

#### `getListings(query)`
Fetch multiple listings with pagination and filters.

**Input:**
```typescript
{
  keyword?: string
  categoryId?: string (UUID)
  city?: string
  country?: string
  minPrice?: number
  maxPrice?: number
  guests?: number
  cursor?: string (UUID)
  limit?: number (1-50, default 20)
}
```

**Returns:**
```typescript
{
  listings: ListingCardData[]
  nextCursor?: string
  hasMore: boolean
}
```

**Features:**
- Cursor-based pagination
- Full-text search across title, description, address, city
- Filter by category, city, country, price, guests
- Returns only primary image for each listing
- Caching with React `cache()`

---

## Validation

All inputs are validated using Zod schemas defined in `src/lib/validations/listing.ts`:

- **createListingSchema**: Validates all required fields for creating a listing
- **updateListingSchema**: Partial schema for updates (all fields optional)
- **listingQuerySchema**: Validates search and filter parameters

## Authorization

Authorization logic is in `src/lib/authorization.ts`:

- **canCreateListing(user)**: HOST or ADMIN
- **canEditListing(user, listing)**: Owner or ADMIN
- **canDeleteListing(user)**: ADMIN only
- **canPublishListing(user, listing)**: Owner or ADMIN
- **canManageImages(user, listing)**: Owner or ADMIN

## Error Handling

Custom error classes in `src/lib/errors.ts`:

- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ValidationError` (422)
- `ConflictError` (409)
- `InternalServerError` (500)
- `CloudinaryError` (500)
- `DatabaseError` (500)

All Server Actions return consistent error messages for UI display.

## Cloudinary Integration

Image upload flow in `src/lib/cloudinary.ts`:

1. **Upload**: Streams file to Cloudinary with transformations
2. **Optimization**: Creates multiple sizes (400px, 800px, 1200px)
3. **Format**: Auto-converts to WebP/AVIF
4. **Storage**: Saves URLs and public IDs to database
5. **Deletion**: Removes from Cloudinary when deleted

## Performance Optimizations

1. **Cursor-based pagination**: Consistent performance for large datasets
2. **React cache()**: Automatic deduplication of Server Component queries
3. **Selective field loading**: Only fetch required fields
4. **Transactions**: Ensure data consistency for multi-step operations
5. **Cache invalidation**: Revalidate paths after mutations
6. **Denormalized fields**: `averageRating` and `reviewCount` on Listing
7. **Indexed queries**: All common queries are indexed in Prisma schema

## Database Transactions

Used for:
- Creating listings with images and amenities
- Updating listing with amenities
- Setting primary image
- Reordering images

Ensures data consistency and prevents orphaned records.

## Cache Invalidation Strategy

After every mutation:
1. Revalidate `/listings` (list page)
2. Revalidate `/listings/[id]` (detail page)

Uses Next.js `revalidatePath()` for automatic cache invalidation.

## Testing Strategy

### Unit Tests
- Validation schemas (Zod)
- Authorization helpers
- Error handling

### Integration Tests
- Server Actions with mocked Prisma
- Cloudinary upload flow
- Authorization checks

### E2E Tests
- Create listing flow
- Update listing flow
- Image upload flow
- Search and filter

## Security Considerations

1. **Authorization**: All actions check user permissions
2. **Validation**: All inputs validated with Zod
3. **SQL Injection**: Prevented by Prisma parameterized queries
4. **XSS**: Prevented by React's automatic escaping
5. **File Upload**: Validated file types and sizes
6. **Rate Limiting**: Should be implemented at API level

## Future Enhancements

1. **Image Processing**: Add drag-and-drop, preview, cropping
2. **Bulk Operations**: Upload multiple images at once
3. **Image Optimization**: Add lazy loading, blur placeholders
4. **Analytics**: Track listing views, image views
5. **A/B Testing**: Test different image orders
6. **CDN**: Serve images via CDN for better performance
7. **WebP Support**: Already enabled via Cloudinary
8. **Responsive Images**: Generate multiple sizes for different devices

## Dependencies

- `next`: 14.2.35
- `@prisma/client`: 7.9.1
- `zod`: For validation
- `cloudinary`: For image uploads
- `react`: For cache()

## Notes

- All Server Actions return consistent `{ success, error }` format
- Errors are logged to console for debugging
- Cache invalidation is automatic via `revalidatePath()`
- Transactions ensure data consistency
- Soft deletes preserve data for analytics
- UUIDs used for all primary keys
- Type-safe with full TypeScript support