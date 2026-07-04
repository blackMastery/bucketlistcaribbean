"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { TourCard, type TourCardData } from "@/components/TourCard";
import { toggleFavorite } from "@/app/actions";

export function SavedTourCard({ tour }: { tour: TourCardData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await toggleFavorite(tour.id);
      router.refresh();
    });
  }

  return (
    <div>
      <TourCard tour={tour} isFavorite />
      <button
        type="button"
        onClick={remove}
        className="mt-3 w-full rounded-lg border border-coral/30 py-2 font-sans text-[13px] font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
      >
        Remove from saved
      </button>
    </div>
  );
}
