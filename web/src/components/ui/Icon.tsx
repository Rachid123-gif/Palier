"use client";
import { icons, type LucideProps } from "lucide-react";

export type IconName = keyof typeof icons;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[name as IconName] ?? icons.Circle;
  return <Cmp {...props} />;
}
