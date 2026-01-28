import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatStr: string = 'PPP') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

export const getFallbackImage = (seed: string, width = 400, height = 300) => {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
};
