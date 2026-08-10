// lib/utils.ts - Shared utility functions
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateFull(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getDepartmentColor(department: string): string {
  const colors: Record<string, string> = {
    Engineering: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Design: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    Marketing: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Operations: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Finance: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    HR: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    Research: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    Leadership: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  };
  return colors[department] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
}
