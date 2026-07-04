"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TourItinerary } from "@/lib/database.types";

export function Itinerary({ days }: { days: TourItinerary[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mb-[38px] flex flex-col gap-3">
      {days.map((d, i) => {
        const isOpen = open === i;
        return (
          <div
            key={d.id}
            className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center gap-4 border-none bg-transparent p-5 px-6 text-left"
            >
              <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-green font-sans text-[13px] font-bold text-sand">
                DAY {d.day_number}
              </span>
              <span className="flex-1 font-sans text-[16.5px] font-semibold text-ink">
                {d.title}
              </span>
              <span
                className="text-[20px] text-green transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ⌄
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <p className="m-0 px-6 pb-[22px] text-[14.5px] leading-[1.7] text-ink-soft sm:pl-[82px] sm:pr-6">
                    {d.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
