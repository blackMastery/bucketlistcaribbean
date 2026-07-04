"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export function Carousel({
  images,
  tourId,
  slug,
}: {
  images: string[];
  tourId: string;
  slug: string;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [fav, setFav] = useState(false);
  const [, startTransition] = useTransition();
  const n = images.length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("tour_id")
        .eq("user_id", user.id)
        .eq("tour_id", tourId)
        .maybeSingle();
      if (data) setFav(true);
    });
  }, [tourId]);

  function onFav() {
    const next = !fav;
    setFav(next);
    startTransition(async () => {
      const res = await toggleFavorite(tourId);
      if (res.needsAuth) {
        router.push(`/login?redirect=/tours/${slug}`);
        setFav(false);
      } else if (!res.ok) setFav(!next);
    });
  }

  return (
    <div className="relative h-[480px] overflow-hidden rounded-2xl bg-blue shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-[600px]:h-[300px]">
      {images.map((src, idx) => (
        <div
          key={idx}
          className="absolute inset-0 bg-blue transition-opacity duration-500"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: idx === i ? 1 : 0,
          }}
        />
      ))}
      {n > 1 && (
        <>
          <button
            onClick={() => setI((c) => (c - 1 + n) % n)}
            aria-label="Previous"
            className="absolute left-[18px] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-none bg-white/[0.92] text-[20px] text-ink shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-white"
          >
            <Icon name="chevron-left" size={24} />
          </button>
          <button
            onClick={() => setI((c) => (c + 1) % n)}
            aria-label="Next"
            className="absolute right-[18px] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-none bg-white/[0.92] text-[20px] text-ink shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-white"
          >
            <Icon name="chevron-right" size={24} />
          </button>
        </>
      )}
      <div className="absolute bottom-[18px] left-[18px] rounded-[20px] bg-[rgba(15,38,30,0.7)] px-3.5 py-[7px] font-sans text-[13px] font-medium text-sand">
        {i + 1} / {n}
      </div>
      <button
        onClick={onFav}
        aria-label={fav ? "Remove from saved" : "Save tour"}
        className="absolute right-[18px] top-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-full border-none bg-white/[0.92] text-[20px] hover:bg-white"
        style={{ color: fav ? "#FF6B5B" : "#2C2C2C" }}
      >
        <Icon
          name="heart"
          size={20}
          fill={fav ? "currentColor" : "none"}
          strokeWidth={fav ? 0 : 2}
        />
      </button>
    </div>
  );
}
