"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { Icon } from "@/components/icons";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Tours & Experiences", href: "/tours" },
  { label: "Destinations", href: "/destinations" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex flex-shrink-0 items-center gap-[13px] no-underline"
    >
      <span className="relative h-[46px] w-[46px] overflow-hidden rounded-full border-[1.5px] border-gold/65 shadow-[0_0_0_3px_rgba(227,168,40,0.1)]">
        <Image
          src="/logo-mark.png"
          alt="Mista Concierge"
          fill
          className="object-cover"
        />
      </span>
      <span className="flex flex-col leading-[1.1]">
        <span className="text-gold-gradient font-serif text-[19px] font-bold tracking-[0.2px]">
          Bucketlist Caribbean
        </span>
        <span className="hidden font-sans text-[8.5px] font-semibold uppercase tracking-[2.8px] text-[#C9A24A] min-[400px]:inline">
          by Mista Concierge Travel Co
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = createClient();
    async function sync(userId: string | undefined) {
      setSignedIn(!!userId);
    }
    supabase.auth.getUser().then(({ data }) => sync(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      sync(session?.user?.id),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useBodyScrollLock(open);

  const accountHref = signedIn ? "/account" : "/login";
  const accountLabel = signedIn ? "Account" : "Sign in";

  const mobileMenu =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[1001] bg-black/55"
            />
            <motion.div
              key="mobile-menu-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed bottom-0 left-0 top-0 z-[1002] flex w-[78%] max-w-[320px] flex-col gap-1.5 overflow-y-auto border-r border-gold/20 bg-[#0A0D0C] p-6 shadow-[8px_0_32px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-5">
                <Logo onClick={() => setOpen(false)} />
              </div>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-gold/15 px-2 py-3.5 font-sans text-[17px] font-semibold text-[#EDE6D4] no-underline"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(accountHref);
                }}
                className="border-b border-gold/15 px-2 py-3.5 text-left font-sans text-[17px] font-semibold text-[#EDE6D4]"
              >
                {accountLabel}
              </button>
              <Link
                href="/contact"
                className="mt-[18px] rounded-lg bg-gradient-to-b from-[#F2C14E] to-[#D9A526] py-3.5 text-center font-sans text-[15px] font-semibold text-[#0A0D0C] no-underline"
              >
                Book Now
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header className="sticky top-0 z-[1000] border-b border-gold/20 bg-[rgba(9,12,11,0.94)] backdrop-blur-md">
        <div className="mx-auto flex h-[78px] max-w-[1280px] items-center justify-between gap-4 px-8 max-[640px]:gap-3 max-[640px]:px-[22px]">
          <Logo />

          <nav className="hidden items-center gap-[34px] min-[861px]:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 font-sans text-[14.5px] font-medium no-underline transition-colors hover:text-gold-light ${
                  isActive(pathname, item.href)
                    ? "border-b-2 border-gold text-gold-light"
                    : "text-[#E0DAC9]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-shrink-0 items-center gap-3.5">
            <Link
              href={accountHref}
              className="hidden font-sans text-[14px] font-medium text-[#E0DAC9] no-underline transition-colors hover:text-gold-light min-[861px]:inline"
            >
              {accountLabel}
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-lg bg-gradient-to-b from-[#F2C14E] to-[#D9A526] px-6 py-[11px] font-sans text-[14px] font-semibold text-[#0A0D0C] no-underline shadow-[0_4px_14px_rgba(227,168,40,0.28)] transition-transform hover:-translate-y-px min-[861px]:inline-block"
            >
              Book Now
            </Link>
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border-none bg-transparent min-[861px]:hidden"
            >
              {open ? (
                <Icon name="x" size={22} className="text-gold" />
              ) : (
                <>
                  <span className="h-0.5 w-6 rounded bg-gold" />
                  <span className="h-0.5 w-6 rounded bg-gold" />
                  <span className="h-0.5 w-6 rounded bg-gold" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileMenu}
    </>
  );
}
