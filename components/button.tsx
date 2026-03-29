import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary: "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
  ghost: "text-primary-600 hover:bg-primary-50",
  danger: "bg-danger-500 text-white hover:bg-danger-600"
} as const;

const sizes = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm"
} as const;

type CommonProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function Button({
  children,
  variant = "primary",
  size = "lg",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "lg",
  className,
  ...props
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
