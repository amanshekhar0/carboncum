import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Shadcn/UI utility for tailwind class merging.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
