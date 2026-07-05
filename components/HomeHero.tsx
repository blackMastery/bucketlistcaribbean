"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Icon, parseRatingText, StatBig } from "@/components/icons";
import type { HeroContent, StatItem } from "@/lib/format";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=2400&q=85";

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HomeHero({
  hero,
  stats,
}: {
  hero: HeroContent;
  stats: StatItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.18]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.85, 0.6]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const parallaxImageStyle = reducedMotion
    ? undefined
    : { y: imageY, scale: imageScale };
  const parallaxContentStyle = reducedMotion ? undefined : { y: contentY };
  const parallaxOverlayStyle = reducedMotion ? undefined : { opacity: overlayOpacity };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[92vh] flex-col overflow-hidden sm:min-h-[100vh]"
    >
      {/* Parallax background */}
      <div className="absolute inset-0 bg-night">
        <motion.div
          className="absolute -top-[12%] left-0 h-[125%] w-full will-change-transform"
          style={parallaxImageStyle}
        >
          <Image
            src={HERO_IMAGE}
            alt="Overwater bungalows above crystal-clear turquoise lagoon at sunset"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_45%]"
          />
        </motion.div>

        {/* Cinematic overlays */}
        <motion.div
          className="absolute inset-0"
          style={parallaxOverlayStyle}
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/75 to-night/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(227,168,40,0.12),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_20%_80%,rgba(27,122,92,0.18),transparent_60%)]" />
        </motion.div>

        {/* Ambient light orbs */}
        {!reducedMotion && (
          <>
            <motion.div
              className="pointer-events-none absolute -left-16 top-1/4 h-64 w-64 rounded-full bg-gold/[0.07] blur-3xl"
              animate={{ y: [0, -18, 0], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.div
              className="pointer-events-none absolute -right-10 bottom-1/3 h-72 w-72 rounded-full bg-green/[0.1] blur-3xl"
              animate={{ y: [0, 14, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              aria-hidden
            />
          </>
        )}
      </div>

      {/* Hero content */}
      <motion.div
        className="relative z-10 flex flex-1 items-center px-[22px] pb-10 pt-[92px] sm:px-8 sm:pb-14 sm:pt-[128px]"
        style={parallaxContentStyle}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          <motion.div
            className="max-w-[720px]"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-gold/45 bg-night/40 px-4 py-2 backdrop-blur-md"
            >
              <span className="inline-flex items-center gap-1.5 text-gold">
                <Icon name="star" size={13} fill="currentColor" strokeWidth={0} />
                <span className="font-sans text-[12.5px] font-semibold tracking-[0.3px] text-sand">
                  {parseRatingText(hero.badge_rating)}
                </span>
              </span>
              <span className="h-3.5 w-px bg-gold/35" aria-hidden />
              <span className="font-sans text-[12.5px] font-medium tracking-[0.3px] text-sand/90">
                {hero.badge_text}
              </span>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-6 h-px w-16 bg-gradient-to-r from-gold to-transparent" aria-hidden />

            <motion.h1
              variants={itemVariants}
              className="m-0 mb-6 font-serif text-[36px] font-bold leading-[1.06] text-sand [text-shadow:0_4px_32px_rgba(0,0,0,0.55)] sm:text-[52px] lg:text-[68px]"
            >
              {(() => {
                const words = hero.headline.trim().split(/\s+/);
                if (words.length <= 3) return hero.headline;
                const accent = words.slice(-2).join(" ");
                const lead = words.slice(0, -2).join(" ");
                return (
                  <>
                    <span className="block">{lead}</span>
                    <span className="mt-1 block bg-gradient-to-r from-gold-light via-gold to-gold-deep bg-clip-text text-transparent [text-shadow:none]">
                      {accent}
                    </span>
                  </>
                );
              })()}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="m-0 mb-9 max-w-[580px] text-[16px] leading-[1.65] text-sand/88 sm:text-[19px] [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]"
            >
              {hero.description}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center sm:gap-4"
            >
              <Link
                href={hero.primary_cta_href}
                className="group relative overflow-hidden rounded-lg bg-green px-9 py-4 text-center font-sans text-[16px] font-semibold text-sand no-underline shadow-[0_8px_32px_rgba(27,122,92,0.45)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:bg-green-dark hover:shadow-[0_12px_40px_rgba(27,122,92,0.55)]"
              >
                <span className="relative z-10">{hero.primary_cta_label}</span>
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden
                />
              </Link>
              <Link
                href={hero.secondary_cta_href}
                className="rounded-lg border border-sand/35 bg-white/[0.06] px-8 py-3.5 text-center font-sans text-[16px] font-semibold text-sand no-underline backdrop-blur-sm transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white/[0.12]"
              >
                {hero.secondary_cta_label}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats ribbon */}
      {stats.length > 0 && (
        <div className="relative z-10 border-t border-gold/20 bg-night/55 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-x-10 gap-y-5 px-[22px] py-6 sm:gap-x-16 sm:px-8 sm:py-7">
            {stats.map((st, i) => (
              <motion.div
                key={st.label}
                className="min-w-[42%] text-center sm:min-w-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="font-serif text-[24px] font-bold text-gold sm:text-[28px]">
                  <StatBig value={st.num} starSize={18} />
                </div>
                <div className="mt-0.5 font-sans text-[11px] uppercase tracking-[0.6px] text-sand/75">
                  {st.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll cue */}
      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute bottom-28 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          aria-hidden
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-sand/50"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <span className="block h-2.5 w-2.5 rotate-45 border-b border-r border-current" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
