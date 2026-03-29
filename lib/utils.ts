import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompactDate(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short"
  }).format(new Date(date));
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}
