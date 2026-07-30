import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "₹"): string {
  return `${currency}${price.toLocaleString("en-IN")}`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getNights(checkIn: Date, checkOut: Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const millisecondsPerNight = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((end.getTime() - start.getTime()) / millisecondsPerNight);
  return nights;
}