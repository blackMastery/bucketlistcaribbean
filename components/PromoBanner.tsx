"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PromoBannerContent } from "@/lib/format";
import { Icon } from "@/components/icons";

export function PromoBanner({ content }: { content: PromoBannerContent }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("mc-banner-dismissed") === "1") setOpen(false);
  }, []);

  // The promo bar only appears on the home page.
  if (pathname !== "/") return null;

  function close() {
    setOpen(false);
    sessionStorage.setItem("mc-banner-dismissed", "1");
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="relative flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 bg-blue px-4 py-3 pr-14 text-center font-sans text-[13.5px] font-medium text-sand max-[640px]:text-left">
            <span>
              <strong className="text-gold">{content.strong}</strong>{" "}
              {content.text}
            </span>
            <Link
              href={content.cta_href}
              className="font-semibold text-gold underline"
            >
              {content.cta_label}
            </Link>
            <button
              onClick={close}
              aria-label="Dismiss"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border-none bg-transparent text-[20px] leading-none text-sand"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
