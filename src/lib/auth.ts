import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface User {
  id: string;
  email: string;
  username: string;
  role: "GUEST" | "HOST" | "ADMIN";
  avatar: string | null;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return null;
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

/**
 * Require specific role
 */
export async function requireRole(role: "GUEST" | "HOST" | "ADMIN"): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== role && user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  
  return user;
}

/**
 * Require host or admin role
 */
export async function requireHost(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== "HOST" && user.role !== "ADMIN") {
    throw new Error("Forbidden - Host role required");
  }
  
  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden - Admin role required");
  }
  
  return user;
}
