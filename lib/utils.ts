import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncateString = (str: string, maxLength: number) => {
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

export const getPublicUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return process.env.NEXT_PUBLIC_APP_URL;
};
