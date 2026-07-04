"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toggleFavorite } from "@/app/actions";
import { Icon, Stars } from "@/components/icons";
import { formatPrice } from "@/lib/format";

export type TourCardData = {
  id: string;
  slug: string;
  title: string;
  location: string;
  price_cents: number;
  pricePerPerson?: boolean;
  rating: number;
  reviews_count: number;
  duration_label: string;
  badge: string | null;
  badge_color: string;
  card_image_url: string;
};

export function TourCard({
  tour,
  isFavorite = false,
}: {
  tour: TourCardData;
  isFavorite?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(isFavorite);
  const [, startTransition] = useTransition();

  function onToggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    startTransition(async () => {
      const res = await toggleFavorite(tour.id);
      if (res.needsAuth) {
        router.push(`/login?redirect=/tours/${tour.slug}`);
        setFav(false);
        return;
      }
      if (!res.ok) setFav(!next);
    });
  }

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Link
        href={`/tours/${tour.slug}`}
        className="group block overflow-hidden rounded-xl border border-ink/5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_14px_40px_rgba(27,122,92,0.18)]"
      >
        <div className="relative h-[230px] overflow-hidden">
          <Image
            src={tour.card_image_url}
            alt={tour.title}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-black/35" />
          {tour.badge && (
            <span
              className="absolute left-3.5 top-3.5 rounded-md px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.5px] text-white"
              style={{ background: tour.badge_color }}
            >
              {tour.badge}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleFav}
            aria-label={fav ? "Remove from saved" : "Save tour"}
            className="absolute right-3 top-3 flex h-[38px] w-[38px] items-center justify-center rounded-full border-none bg-white/90 leading-none transition-transform hover:scale-110"
            style={{ color: fav ? "#FF6B5B" : "#2C2C2C" }}
          >
            <Icon
              name="heart"
              size={18}
              fill={fav ? "currentColor" : "none"}
              strokeWidth={fav ? 0 : 2}
            />
          </button>
        </div>
        <div className="px-5 pb-[22px] pt-5">
          <div className="mb-[7px] flex items-center gap-1.5">
            <Icon name="map-pin" size={13} className="text-green" strokeWidth={2.5} />
            <span className="font-sans text-[12.5px] font-medium uppercase tracking-[0.3px] text-green">
              {tour.location}
            </span>
          </div>
          <h3 className="mb-3 font-serif text-[21px] font-semibold leading-[1.25] text-ink">
            {tour.title}
          </h3>
          <div className="mb-4 flex items-center gap-2">
            <Stars size={14} />
            <span className="text-[13px] text-muted">
              {tour.rating.toFixed(1)} · {tour.reviews_count} reviews
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-ink/[0.08] pt-3.5">
            <div>
              <div className="mb-0.5 text-[12px] text-muted-light">
                {tour.duration_label}
              </div>
              <div className="font-serif text-[22px] font-bold text-gold">
                {formatPrice(tour.price_cents)}
                {tour.pricePerPerson !== false && (
                  <span className="font-body text-[12px] font-normal text-muted-light">
                    {" "}
                    / person
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-lg bg-green px-[18px] py-[9px] font-sans text-[13px] font-semibold text-white transition-colors group-hover:bg-green-dark">
              View Tour
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
