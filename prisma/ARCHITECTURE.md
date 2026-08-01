# WanderLust 2.0 - Database Architecture

## Table of Contents
1. [ER Diagram](#er-diagram)
2. [Model Relations](#model-relations)
3. [Indexing Strategy](#indexing-strategy)
4. [Query Optimization](#query-optimization)
5. [Best Practices](#best-practices)
6. [Future Scalability](#future-scalability)

---

## ER Diagram

```mermaid
erDiagram
    User ||--o{ Listing : "hosts"
    User ||--o{ Booking : "guest"
    User ||--o{ Booking : "host"
    User ||--o{ Review : "reviews"
    User ||--o{ Wishlist : "owns"
    User ||--o{ Notification : "receives"
    User ||--o{ Session : "has"
    User ||--o{ RefreshToken : "has"
    
    Listing ||--o{ ListingImage : "has"
    Listing ||--o{ Booking : "receives"
    Listing ||--o{ Review : "receives"
    Listing ||--o{ ListingAmenity : "has"
    Listing }o--|| Category : "belongs_to"
    
    Category ||--o{ Category : "parent"
    Category ||--o{ Listing : "contains"
    
    Amenity ||--o{ ListingAmenity : "in"
    Listing ||--o{ ListingAmenity : "has"
    
    Booking ||--o| Review : "has"
    
    Wishlist }o--|| User : "belongs_to"
    Wishlist }o--o{ Listing : "contains"
    
    Notification }o--|| User : "belongs_to"
    
    Session }o--|| User : "belongs_to"
    RefreshToken }o--|| User : "belongs_to"
```

---

## Model Relations

### 1. User Model

**Purpose**: Central user entity supporting multiple roles (Guest, Host, Admin)

**Relationships**:
- **One-to-Many (Listings)**: A user (as host) can have multiple listings
  - `onDelete: Cascade` - When user is deleted, their listings are soft-deleted
- **One-to-Many (Bookings as Guest)**: A user can make multiple bookings
  - Named relation `BookingsAsGuest` to distinguish from host bookings
- **One-to-Many (Bookings as Host)**: A user (as host) can receive multiple bookings
  - Named relation `BookingsAsHost` for clarity
- **One-to-Many (Reviews)**: A user can write multiple reviews
- **One-to-Many (Wishlists)**: A user can have multiple wishlists
- **One-to-Many (Notifications)**: A user can receive multiple notifications
  - `onDelete: Cascade` - Delete notifications when user is deleted
- **One-to-Many (Sessions)**: A user can have multiple active sessions
  - `onDelete: Cascade` - Clean up sessions on user deletion
- **One-to-Many (RefreshTokens)**: A user can have multiple refresh tokens
  - `onDelete: Cascade` - Clean up tokens on user deletion

**Soft Delete**: `deletedAt` field allows for data retention while hiding deleted users

---

### 2. Listing Model

**Purpose**: Core accommodation entity with rich metadata

**Relationships**:
- **Many-to-One (User as Host)**: A listing belongs to one host
  - `onDelete: Cascade` - If host is deleted, listing is soft-deleted
- **Many-to-One (Category)**: A listing belongs to one category
  - No cascade - Categories are independent
- **One-to-Many (ListingImage)**: A listing can have multiple images
  - `onDelete: Cascade` - Delete images when listing is deleted
- **One-to-Many (Booking)**: A listing can have multiple bookings
  - No cascade - Preserve booking history
- **One-to-Many (Review)**: A listing can have multiple reviews
  - No cascade - Preserve reviews for analytics
- **Many-to-Many (Amenity via ListingAmenity)**: A listing can have multiple amenities
  - `onDelete: Cascade` on both sides - Clean up junction records
- **Many-to-Many (Wishlist)**: A listing can be in multiple wishlists
  - No cascade - Preserve wishlist data

**Denormalized Fields**:
- `averageRating`: Pre-calculated average for performance
- `reviewCount`: Total review count for quick display

**Soft Delete**: `deletedAt` field for data retention

---

### 3. ListingImage Model

**Purpose**: Separate entity for listing images to support multiple images per listing

**Relationships**:
- **Many-to-One (Listing)**: An image belongs to one listing
  - `onDelete: Cascade` - Delete images when listing is deleted

**Fields**:
- `publicId`: Cloudinary public ID for image management
- `isPrimary`: Flag for primary/cover image
- `sortOrder`: For ordering images in gallery

---

### 4. Category Model

**Purpose**: Hierarchical categorization of listings

**Relationships**:
- **Self-Referencing (Parent-Child)**: Categories can have subcategories
  - Named relation `CategoryHierarchy`
  - No cascade - Prevent accidental category deletion
- **One-to-Many (Listing)**: A category can have multiple listings
  - No cascade - Listings should persist if category is deleted

**Unique Constraints**:
- `name`: Prevent duplicate category names
- `slug`: For SEO-friendly URLs

---

### 5. Amenity Model

**Purpose**: Reusable amenity definitions (WiFi, Pool, Parking, etc.)

**Relationships**:
- **Many-to-Many (Listing via ListingAmenity)**: An amenity can be in multiple listings
  - `onDelete: Cascade` on junction table

**Unique Constraints**:
- `name`: Prevent duplicate amenities

---

### 6. ListingAmenity Model

**Purpose**: Junction table for Listing-Amenity many-to-many relationship

**Relationships**:
- **Many-to-One (Listing)**: Belongs to one listing
  - `onDelete: Cascade`
- **Many-to-One (Amenity)**: Belongs to one amenity
  - `onDelete: Cascade`

**Unique Constraints**:
- `[listingId, amenityId]`: Prevent duplicate amenity assignments

---

### 7. Booking Model

**Purpose**: Core booking entity with comprehensive booking management

**Relationships**:
- **Many-to-One (User as Guest)**: A booking has one guest
  - No cascade - Preserve booking history
- **Many-to-One (User as Host)**: A booking has one host
  - No cascade - Preserve booking history
- **Many-to-One (Listing)**: A booking is for one listing
  - No cascade - Preserve booking history
- **One-to-One (Review)**: A booking can have one review
  - No cascade - Review is optional

**Enums**:
- `BookingStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `PaymentStatus`: PENDING, PAID, REFUNDED, FAILED

**Pricing Breakdown**:
- `subtotal`: Base price (nights × nightly rate)
- `cleaningFee`: One-time cleaning fee
- `serviceFee`: Platform service fee
- `totalPrice`: Total amount

**Soft Delete**: `deletedAt` for audit trail

**Indexes**:
- Composite indexes for common queries (guest + status, host + status, listing + dates)

---

### 8. Review Model

**Purpose**: User-generated reviews for listings

**Relationships**:
- **One-to-One (Booking)**: A review is linked to one booking
  - `@unique` constraint ensures one review per booking
  - No cascade - Preserve review even if booking is deleted
- **Many-to-One (User as Reviewer)**: A review is written by one user
  - No cascade - Preserve review even if user is deleted
- **Many-to-One (Listing)**: A review belongs to one listing
  - No cascade - Preserve reviews for analytics
- **Many-to-One (User as Host)**: A review is about one host
  - Named relation `HostReviews` for clarity
  - No cascade - Preserve review even if host is deleted

**Constraints**:
- `bookingId @unique`: Enforce one review per booking
- `rating`: 1-5 scale (validated in application layer)

**Soft Delete**: `deletedAt` for moderation

---

### 9. Wishlist Model

**Purpose**: User's saved/favorited listings

**Relationships**:
- **Many-to-One (User)**: A wishlist belongs to one user
  - `onDelete: Cascade` - Delete wishlists when user is deleted
- **Many-to-Many (Listing)**: A wishlist can contain multiple listings
  - Named relation `WishlistListings`
  - No cascade - Preserve wishlist data

**Unique Constraints**:
- `[userId, name]`: Prevent duplicate wishlist names per user

**Note**: This is a simplified wishlist model. For production, consider:
- Multiple wishlists per user
- Privacy settings (public/private)
- Collaboration (shared wishlists)

---

### 10. Notification Model

**Purpose**: In-app notifications for users

**Relationships**:
- **Many-to-One (User)**: A notification belongs to one user
  - `onDelete: Cascade` - Delete notifications when user is deleted

**Enums**:
- `NotificationType`: BOOKING_REQUEST, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_COMPLETED, REVIEW_REQUEST, NEW_MESSAGE, SYSTEM
- `NotificationChannel`: EMAIL, PUSH, SMS, IN_APP

**Fields**:
- `data`: JSON field for flexible additional data (booking ID, listing ID, etc.)
- `isRead`: Boolean flag for read/unread status

**Soft Delete**: `deletedAt` for cleanup

---

### 11. Session Model

**Purpose**: User session management (if not using JWT)

**Relationships**:
- **Many-to-One (User)**: A session belongs to one user
  - `onDelete: Cascade` - Clean up sessions on user deletion

**Fields**:
- `sessionToken`: Unique session identifier
- `expires`: Session expiration timestamp

**Note**: This model is optional if using JWT-only authentication. Included for flexibility.

---

### 12. RefreshToken Model

**Purpose**: JWT refresh token management

**Relationships**:
- **Many-to-One (User)**: A refresh token belongs to one user
  - `onDelete: Cascade` - Clean up tokens on user deletion

**Fields**:
- `token`: Unique refresh token
- `expires`: Token expiration timestamp
- `isRevoked`: Boolean flag for token revocation

**Indexes**:
- `token`: For fast token lookup
- `isRevoked`: For filtering valid tokens

---

## Indexing Strategy

### Primary Keys
- All models use UUID primary keys for:
  - Distributed system compatibility
  - Security (non-sequential)
  - Easy merging from multiple databases

### Unique Constraints
1. **User**: `email`, `username`
2. **Category**: `name`, `slug`
3. **Amenity**: `name`
4. **Wishlist**: `[userId, name]`
5. **ListingAmenity**: `[listingId, amenityId]`
6. **Review**: `bookingId` (one review per booking)
7. **Session**: `sessionToken`
8. **RefreshToken**: `token`

### Single-Field Indexes

**User**:
- `email`: Login lookups
- `username`: Profile lookups
- `role`: Admin/host filtering
- `createdAt`: Sorting
- `deletedAt`: Soft delete filtering

**Listing**:
- `hostId`: Find listings by host
- `categoryId`: Filter by category
- `city`: Location-based search
- `country`: Location-based search
- `price`: Price range filtering
- `averageRating`: Sorting by rating
- `isActive`: Filter active listings
- `isFeatured`: Featured listings
- `createdAt`: Sorting
- `deletedAt`: Soft delete filtering
- `[latitude, longitude]`: Geospatial queries
- `[city, country]`: Combined location search

**Booking**:
- `guestId`: Find user's bookings
- `hostId`: Find host's bookings
- `listingId`: Find listing's bookings
- `status`: Filter by booking status
- `paymentStatus`: Filter by payment status
- `checkInDate`: Date range queries
- `checkOutDate`: Date range queries
- `createdAt`: Sorting
- `deletedAt`: Soft delete filtering

**Review**:
- `bookingId`: Find review for booking
- `reviewerId`: Find user's reviews
- `listingId`: Find listing's reviews
- `hostId`: Find host's reviews
- `rating`: Filter by rating
- `createdAt`: Sorting

**Notification**:
- `userId`: Find user's notifications
- `isRead`: Filter unread notifications
- `type`: Filter by notification type
- `createdAt`: Sorting

### Composite Indexes

**Booking**:
- `[guestId, status]`: "Show me my pending bookings"
- `[hostId, status]`: "Show me pending bookings for my listings"
- `[listingId, checkInDate, checkOutDate]`: "Check availability for date range"

**Review**:
- `[listingId, rating]`: "Show reviews for listing sorted by rating"

**Notification**:
- `[userId, isRead]`: "Show unread notifications for user"

### Full-Text Search
- **Listing**: `[title, description, address, city]`
  - Enables search across listing content
  - Use PostgreSQL's `@@` operator with `websearch_to_tsquery`

---

## Query Optimization

### 1. N+1 Query Prevention

**Problem**: Fetching listings with their images, reviews, and host info

**Bad Query**:
```typescript
const listings = await prisma.listing.findMany();
for (const listing of listings) {
  const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
  const reviews = await prisma.review.findMany({ where: { listingId: listing.id } });
}
```

**Optimized Query**:
```typescript
const listings = await prisma.listing.findMany({
  include: {
    images: true,
    reviews: {
      include: { reviewer: true }
    },
    host: {
      select: { id: true, username: true, avatar: true }
    }
  }
});
```

### 2. Pagination

**Always use cursor-based pagination for large datasets**:

```typescript
const first = 20;
const after = cursor; // From previous query

const listings = await prisma.listing.findMany({
  take: first,
  skip: after ? 1 : 0,
  cursor: after ? { id: after } : undefined,
  orderBy: { createdAt: 'desc' }
});
```

**Why cursor-based?**
- Consistent performance regardless of offset
- No skipped/missing records during inserts
- Better for infinite scroll

### 3. Selective Field Loading

**Problem**: Fetching unnecessary fields wastes memory and bandwidth

**Bad Query**:
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
```

**Optimized Query**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    avatar: true,
    // Exclude sensitive fields like email, phone
  }
});
```

### 4. Batch Operations

**Problem**: Multiple sequential queries

**Bad Query**:
```typescript
await prisma.listing.update({ where: { id: id1 }, data: { views: { increment: 1 } } });
await prisma.listing.update({ where: { id: id2 }, data: { views: { increment: 1 } } });
await prisma.listing.update({ where: { id: id3 }, data: { views: { increment: 1 } } });
```

**Optimized Query**:
```typescript
await prisma.listing.updateMany({
  where: { id: { in: [id1, id2, id3] } },
  data: { views: { increment: 1 } }
});
```

### 5. Aggregation Queries

**Problem**: Calculating averages in application code

**Bad Query**:
```typescript
const reviews = await prisma.review.findMany({ where: { listingId } });
const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
```

**Optimized Query**:
```typescript
const result = await prisma.review.aggregate({
  where: { listingId },
  _avg: { rating: true },
  _count: { rating: true }
});
const averageRating = result._avg.rating;
const reviewCount = result._count.rating;
```

### 6. Connection Pooling

**Use Prisma's connection pooling for serverless**:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

### 7. Caching Strategy

**Use Redis for frequently accessed data**:

```typescript
// Cache popular listings for 5 minutes
const cachedListings = await redis.get(`listings:popular`);
if (cachedListings) {
  return JSON.parse(cachedListings);
}

const listings = await prisma.listing.findMany({ /* ... */ });
await redis.setex(`listings:popular`, 300, JSON.stringify(listings));
```

**Cache invalidation**:
- Invalidate on listing update/delete
- Invalidate on new booking
- Invalidate on new review

---

## Best Practices Used

### 1. UUID Primary Keys
**Why**: 
- Non-sequential (security)
- Distributed system friendly
- No ID enumeration
- Easy merging from multiple databases

**Trade-off**: Slightly larger index size vs. auto-increment integers

### 2. Soft Deletes
**Why**:
- Data retention for analytics
- Audit trail
- Recovery from accidental deletion
- Compliance requirements

**Implementation**: `deletedAt` timestamp field
**Query**: `where: { deletedAt: null }` for active records

### 3. Denormalization
**Why**:
- Reduce JOIN operations
- Improve read performance
- Pre-calculate expensive aggregations

**Examples**:
- `Listing.averageRating`: Avoid `_avg` aggregation on every query
- `Listing.reviewCount`: Avoid `_count` aggregation on every query

**Maintenance**: Update denormalized fields via triggers or application logic

### 4. Cascading Deletes
**Why**:
- Maintain referential integrity
- Automatic cleanup
- Prevent orphaned records

**Where Used**:
- User → Listings, Sessions, RefreshTokens, Notifications
- Listing → Images, ListingAmenities
- Wishlist → (none, preserve wishlist data)

**Where NOT Used**:
- Booking → Review (preserve review history)
- Listing → Bookings (preserve booking history)
- User → Bookings (preserve booking history)

### 5. Unique Constraints
**Why**:
- Prevent duplicate data
- Enforce business rules
- Improve query performance

**Examples**:
- One review per booking
- One wishlist name per user
- Unique email/username per user

### 6. Timestamps
**Why**:
- Audit trail
- Sorting
- Debugging
- Analytics

**Fields**:
- `createdAt`: Record creation time
- `updatedAt`: Last modification time (auto-updated by Prisma)
- `deletedAt`: Soft delete timestamp

### 7. Enums
**Why**:
- Type safety
- Prevent invalid values
- Self-documenting code
- Better performance than strings

**Examples**:
- `UserRole`: GUEST, HOST, ADMIN
- `BookingStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `NotificationType`: Various notification types

### 8. JSON Fields
**Why**:
- Flexible schema for variable data
- Store additional metadata
- Avoid schema migrations for minor changes

**Example**:
- `Notification.data`: Store booking ID, listing ID, etc.

**Trade-off**: Cannot query JSON fields efficiently (use for non-searchable data)

### 9. Composite Indexes
**Why**:
- Optimize common query patterns
- Reduce index size vs. separate indexes
- Improve query performance

**Examples**:
- `[guestId, status]`: "Show me my pending bookings"
- `[listingId, checkInDate, checkOutDate]`: "Check availability"

### 10. Full-Text Search
**Why**:
- Enable search across multiple fields
- Better than LIKE queries
- Support for relevance ranking

**Example**:
- Listing search across title, description, address, city

---

## Future Scalability Considerations

### 1. Database Sharding

**When**: > 10M listings, > 100M bookings

**Strategy**:
- Shard by `country` or `region` for listings
- Shard by `createdAt` (time-based) for bookings
- Use PostgreSQL Citus for distributed PostgreSQL

### 2. Read Replicas

**When**: > 1000 concurrent reads

**Strategy**:
- Primary database for writes
- 2-3 read replicas for reads
- Use Prisma's read replica support:

```typescript
const listings = await prisma.$queryRaw`
  SELECT * FROM listings WHERE is_active = true
`;
```

### 3. Caching Layers

**When**: > 5000 requests/second

**Strategy**:
- **L1 Cache**: In-memory (Node.js cache)
- **L2 Cache**: Redis (shared cache)
- **CDN**: Static assets and images

**Cache Invalidation**:
- Event-driven invalidation
- TTL-based expiration
- Manual invalidation on updates

### 4. Microservices

**When**: > 50 developers, complex domain logic

**Strategy**:
- **User Service**: Authentication, profiles
- **Listing Service**: Listings, search, availability
- **Booking Service**: Bookings, payments
- **Notification Service**: Emails, push notifications
- **Review Service**: Reviews, ratings

**Communication**:
- REST APIs or gRPC
- Event-driven (Kafka, RabbitMQ)
- Shared database (initially) → Separate databases (later)

### 5. Event Sourcing

**When**: Need full audit trail, complex event replay

**Strategy**:
- Store events instead of state
- Events: `BookingCreated`, `BookingConfirmed`, `BookingCancelled`
- Rebuild state from events
- Use for analytics, debugging, compliance

### 6. CQRS (Command Query Responsibility Segregation)

**When**: Read/write patterns diverge significantly

**Strategy**:
- **Command Side**: Write operations (PostgreSQL)
- **Query Side**: Read operations (Elasticsearch, PostgreSQL materialized views)
- Sync via events

**Benefits**:
- Optimize reads and writes independently
- Scale reads horizontally
- Better performance for complex queries

### 7. Geospatial Queries

**Current**: Simple `[latitude, longitude]` index

**Future**: Use PostGIS for advanced geospatial queries

```sql
-- Find listings within 5km radius
SELECT * FROM listings
WHERE ST_DWithin(
  geography(ST_MakePoint(longitude, latitude)),
  geography(ST_MakePoint($1, $2)),
  5000
);
```

**Use Cases**:
- "Show me listings near me"
- "Show me listings in this neighborhood"
- Distance-based sorting

### 8. Full-Text Search Engine

**Current**: PostgreSQL full-text search

**Future**: Elasticsearch or Meilisearch for advanced search

**Features**:
- Fuzzy search
- Typo tolerance
- Faceted search
- Relevance ranking
- Analytics

### 9. Time-Series Data

**For**: Analytics, metrics, logs

**Strategy**:
- Use TimescaleDB (PostgreSQL extension)
- Store booking metrics, view counts, search queries
- Efficient time-based queries

### 10. Data Archiving

**When**: > 10M records in a table

**Strategy**:
- Archive old bookings (> 2 years) to cold storage
- Archive deleted records after 30 days
- Use PostgreSQL partitioning:

```sql
CREATE TABLE bookings_2023 PARTITION OF bookings
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
```

---

## Performance Targets

### Query Performance
- **Simple queries** (by ID): < 10ms
- **Complex queries** (with JOINs): < 50ms
- **Full-text search**: < 100ms
- **Aggregations**: < 200ms

### Database Capacity
- **Users**: 1M+
- **Listings**: 100K+
- **Bookings**: 1M+
- **Reviews**: 5M+

### Availability
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Backup**: Daily automated backups
- **Recovery**: RTO < 1 hour, RPO < 15 minutes

---

## Monitoring & Observability

### Metrics to Track
1. **Query Performance**: Slow query log, p95/p99 latency
2. **Connection Pool**: Active connections, waiting queries
3. **Cache Hit Rate**: Redis hit/miss ratio
4. **Error Rate**: Failed queries, constraint violations
5. **Database Size**: Table sizes, index sizes, growth rate

### Tools
- **PostgreSQL**: pg_stat_statements, pgBadger
- **Prisma**: Prisma Query Engine logs
- **APM**: Datadog, New Relic, or open-source (Prometheus + Grafana)
- **Logging**: Structured logging with Winston/Pino

---

## Conclusion

This database architecture is designed for:
- **Performance**: Optimized indexes, denormalization, caching
- **Scalability**: UUIDs, soft deletes, connection pooling
- **Maintainability**: Clear relations, enums, constraints
- **Flexibility**: JSON fields, extensible enums
- **Production-Ready**: Comprehensive indexes, cascading deletes, audit trails

The schema supports the full WanderLust 2.0 feature set while maintaining room for future growth.