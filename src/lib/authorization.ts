/**
 * Check if user is a host
 */
export function isHost(user: { role: "GUEST" | "HOST" | "ADMIN" }): boolean {
  return user.role === "HOST" || user.role === "ADMIN";
}

/**
 * Check if user is admin
 */
export function isAdmin(user: { role: "GUEST" | "HOST" | "ADMIN" }): boolean {
  return user.role === "ADMIN";
}

/**
 * Check if user can create listings
 */
export function canCreateListing(user: { role: "GUEST" | "HOST" | "ADMIN" }): boolean {
  return isHost(user);
}

/**
 * Check if user can edit listing
 */
export function canEditListing(
  user: { id: string; role: "GUEST" | "HOST" | "ADMIN" },
  listing: { hostId: string }
): boolean {
  return isAdmin(user) || listing.hostId === user.id;
}

/**
 * Check if user can delete listing
 */
export function canDeleteListing(user: { role: "GUEST" | "HOST" | "ADMIN" }): boolean {
  return isAdmin(user);
}

/**
 * Check if user can publish/unpublish listing
 */
export function canPublishListing(
  user: { id: string; role: "GUEST" | "HOST" | "ADMIN" },
  listing: { hostId: string }
): boolean {
  return isAdmin(user) || listing.hostId === user.id;
}

/**
 * Check if user can manage listing images
 */
export function canManageImages(
  user: { id: string; role: "GUEST" | "HOST" | "ADMIN" },
  listing: { hostId: string }
): boolean {
  return isAdmin(user) || listing.hostId === user.id;
}
