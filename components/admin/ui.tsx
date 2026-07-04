import Link from "next/link";
import type { ReactNode } from "react";
import type { IconName } from "@/components/icons";
import { Icon } from "@/components/icons";

// Shared Tailwind class strings for admin forms/buttons (composed by client forms).
export const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 font-body text-[14px] text-ink outline-none focus:border-green";
export const labelCls =
  "mb-1.5 block font-sans text-[12.5px] font-semibold text-ink-soft";

export function FormLabel({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label className={labelCls} htmlFor={htmlFor}>
      {children}
      {required && <span className="text-coral"> *</span>}
    </label>
  );
}

export function FormRequiredNote() {
  return (
    <p className="m-0 text-[13px] text-muted-light">
      Fields marked with <span className="text-coral">*</span> are required.
    </p>
  );
}
export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-green px-5 py-2.5 font-sans text-[14px] font-semibold text-white transition-colors hover:bg-green-dark disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-ink/15 bg-white px-4 py-2.5 font-sans text-[14px] font-semibold text-ink transition-colors hover:border-green hover:text-green";
export const btnDanger =
  "inline-flex items-center justify-center rounded-lg border border-coral/40 bg-white px-4 py-2.5 font-sans text-[13px] font-semibold text-coral transition-colors hover:bg-coral hover:text-white disabled:opacity-60";
export const cardCls =
  "rounded-2xl border border-ink/[0.06] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 font-serif text-[30px] font-bold text-ink">{title}</h1>
        {subtitle && <p className="m-0 mt-1.5 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${cardCls} ${className}`}>{children}</div>;
}

export function EmptyState({
  icon = "inbox",
  text,
}: {
  icon?: IconName;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
      <div className="mb-2 flex justify-center text-green">
        <Icon name={icon} size={28} strokeWidth={1.75} />
      </div>
      <p className="m-0 text-[14px] text-muted">{text}</p>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-gold/15 text-gold-deep",
  new: "bg-gold/15 text-gold-deep",
  confirmed: "bg-green/[0.12] text-green",
  read: "bg-blue/[0.1] text-blue",
  cancelled: "bg-coral/[0.12] text-coral",
  archived: "bg-ink/[0.08] text-muted",
  published: "bg-green/[0.12] text-green",
  draft: "bg-gold/15 text-gold-deep",
  hidden: "bg-ink/[0.08] text-muted",
  active: "bg-green/[0.12] text-green",
  inactive: "bg-ink/[0.08] text-muted",
  helpful: "bg-green/[0.12] text-green",
  unhelpful: "bg-coral/[0.12] text-coral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 font-sans text-[12px] font-semibold capitalize ${
        STATUS_TONES[status] ?? "bg-ink/[0.08] text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link href={href} className={variant === "primary" ? btnPrimary : btnGhost}>
      {children}
    </Link>
  );
}
