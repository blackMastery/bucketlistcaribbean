import type { ReactNode } from "react";
import { Stars as StarRow } from "@/components/icons";

// Gold uppercase "eyebrow" label used above headings throughout the site.
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-sans font-semibold text-[13px] tracking-[2px] uppercase text-gold ${className}`}
    >
      {children}
    </span>
  );
}

// Five-star glyph row in brand gold.
export function Stars({ className = "" }: { className?: string }) {
  return <StarRow className={className} />;
}
