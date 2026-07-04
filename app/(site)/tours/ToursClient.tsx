"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TourCard } from "@/components/TourCard";
import { Icon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import {
  buildTourSearchParams,
  DURATION_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  type TourFilters,
  type TourPriceBounds,
} from "@/lib/tour-filters";

export type ClientTour = {
  id: string;
  slug: string;
  title: string;
  location: string;
  price_cents: number;
  pricePerPerson: boolean;
  rating: number;
  reviews_count: number;
  duration_label: string;
  duration_days: number;
  badge: string | null;
  badge_color: string;
  card_image_url: string;
  destName: string;
  destSlug: string;
  acts: string[];
  isFavorite: boolean;
};

type DestOption = { name: string; slug: string; count: number };

const H4 = "mb-3 font-sans text-[12px] font-semibold uppercase tracking-[1px] text-muted-light";
const FILTER_LABEL =
  "flex min-h-[44px] cursor-pointer items-center gap-3 py-1 text-[14px] text-ink";

function FilterPanel({
  destOptions,
  activityTypes,
  filters,
  priceBounds,
  maxPriceLocal,
  onMaxPriceChange,
  onToggleDest,
  onToggleActivity,
  onPatch,
  onReset,
  onClose,
  resultCount,
}: {
  destOptions: DestOption[];
  activityTypes: string[];
  filters: TourFilters;
  priceBounds: TourPriceBounds;
  maxPriceLocal: number;
  onMaxPriceChange: (gyd: number) => void;
  onToggleDest: (slug: string) => void;
  onToggleActivity: (name: string) => void;
  onPatch: (partial: Partial<TourFilters>) => void;
  onReset: () => void;
  onClose?: () => void;
  resultCount: number;
}) {
  return (
    <>
      <div className="mb-[22px] flex items-center justify-between">
        <h3 className="m-0 font-sans text-[16px] font-bold text-ink">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="min-h-[44px] border-none bg-transparent px-2 font-sans text-[13px] font-semibold text-green"
          >
            Reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="flex h-11 w-11 items-center justify-center rounded-lg border-none bg-cream text-[22px] leading-none text-ink"
            >
              <Icon name="x" size={22} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className={H4}>Destination</h4>
        {destOptions.map((o) => (
          <label key={o.slug} className={FILTER_LABEL}>
            <input
              type="checkbox"
              checked={filters.destSlugs.includes(o.slug)}
              onChange={() => onToggleDest(o.slug)}
              className="h-5 w-5 shrink-0 cursor-pointer accent-green"
            />
            <span className="flex-1">{o.name}</span>
            <span className="text-[12px] text-[#A8A8A8]">{o.count}</span>
          </label>
        ))}
      </div>

      <div className="mb-6">
        <h4 className={H4}>Max Price</h4>
        <input
          type="range"
          className="mc-range w-full"
          min={priceBounds.minGyd}
          max={priceBounds.maxGyd}
          step={10_000}
          value={maxPriceLocal}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
        />
        <div className="mt-2 flex justify-between text-[13px] text-muted">
          <span>{formatPrice(priceBounds.minGyd * 100)}</span>
          <span className="font-semibold text-green">
            Up to {formatPrice(maxPriceLocal * 100)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className={H4}>Duration</h4>
        {DURATION_OPTIONS.map((o) => (
          <label key={o.val} className={FILTER_LABEL}>
            <input
              type="radio"
              name={onClose ? "mc-dur-mobile" : "mc-dur"}
              checked={filters.dur === o.val}
              onChange={() => onPatch({ dur: o.val })}
              className="h-5 w-5 shrink-0 cursor-pointer accent-green"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      <div className="mb-6">
        <h4 className={H4}>Activity Type</h4>
        {activityTypes.map((a) => (
          <label key={a} className={FILTER_LABEL}>
            <input
              type="checkbox"
              checked={filters.activities.includes(a)}
              onChange={() => onToggleActivity(a)}
              className="h-5 w-5 shrink-0 cursor-pointer accent-green"
            />
            <span>{a}</span>
          </label>
        ))}
      </div>

      <div>
        <h4 className={H4}>Rating</h4>
        {RATING_OPTIONS.map((o) => (
          <label key={o.val} className={FILTER_LABEL}>
            <input
              type="radio"
              name={onClose ? "mc-rate-mobile" : "mc-rate"}
              checked={filters.minRating === o.val}
              onChange={() => onPatch({ minRating: o.val })}
              className="h-5 w-5 shrink-0 cursor-pointer accent-green"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-green py-3.5 font-sans text-[15px] font-semibold text-white"
        >
          Show {resultCount} {resultCount === 1 ? "result" : "results"}
        </button>
      )}
    </>
  );
}

export function ToursClient({
  tours,
  destOptions,
  activityTypes,
  filters,
  priceBounds,
}: {
  tours: ClientTour[];
  destOptions: DestOption[];
  activityTypes: string[];
  filters: TourFilters;
  priceBounds: TourPriceBounds;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [maxPriceLocal, setMaxPriceLocal] = useState(filters.maxPriceGyd);
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useBodyScrollLock(sidebarOpen);

  useEffect(() => {
    setMaxPriceLocal(filters.maxPriceGyd);
  }, [filters.maxPriceGyd]);

  const applyFilters = useCallback(
    (next: TourFilters) => {
      const qs = buildTourSearchParams(next, priceBounds);
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [pathname, priceBounds, router],
  );

  function patch(partial: Partial<TourFilters>) {
    applyFilters({ ...filters, ...partial });
  }

  function toggleDest(slug: string) {
    const set = new Set(filters.destSlugs);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    patch({ destSlugs: [...set] });
  }

  function toggleActivity(name: string) {
    const set = new Set(filters.activities);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    patch({ activities: [...set] });
  }

  function onMaxPriceChange(gyd: number) {
    setMaxPriceLocal(gyd);
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    priceDebounce.current = setTimeout(() => {
      patch({ maxPriceGyd: gyd });
    }, 350);
  }

  function reset() {
    if (priceDebounce.current) clearTimeout(priceDebounce.current);
    applyFilters({
      destSlugs: [],
      activities: [],
      maxPriceGyd: priceBounds.maxGyd,
      dur: "any",
      minRating: 0,
      sort: "popular",
    });
  }

  const filterPanelProps = {
    destOptions,
    activityTypes,
    filters,
    priceBounds,
    maxPriceLocal,
    onMaxPriceChange,
    onToggleDest: toggleDest,
    onToggleActivity: toggleActivity,
    onPatch: patch,
    onReset: reset,
    resultCount: tours.length,
  };

  const mobileDrawer =
    mounted &&
    createPortal(
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="tour-filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[1100] bg-black/50 min-[901px]:hidden"
            />
            <motion.aside
              key="tour-filter-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 top-0 z-[1101] flex w-[min(88vw,340px)] flex-col overflow-y-auto bg-white p-[22px] shadow-[8px_0_32px_rgba(0,0,0,0.18)] min-[901px]:hidden"
            >
              <FilterPanel
                {...filterPanelProps}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>,
      document.body,
    );

  return (
    <div className="mx-auto max-w-[1280px] px-8 pb-20 pt-9 max-[640px]:px-[22px]">
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-expanded={sidebarOpen}
        className="mb-[18px] inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-ink/[0.12] bg-white px-[18px] py-[11px] font-sans text-[14px] font-semibold text-green min-[901px]:hidden"
      >
        {sidebarOpen ? (
          <>
            <Icon name="x" size={16} /> Close
          </>
        ) : (
          <>
            <Icon name="sliders-horizontal" size={16} /> Filters
          </>
        )}
      </button>

      <div className="grid grid-cols-[280px_1fr] items-start gap-[34px] max-[900px]:grid-cols-1">
        <aside className="sticky top-24 rounded-2xl bg-white p-[26px] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] max-[900px]:hidden">
          <FilterPanel {...filterPanelProps} />
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-3.5">
            <p className="m-0 text-[14.5px] text-muted">
              <strong className="font-semibold text-ink">{tours.length}</strong>{" "}
              experiences found
              {pending && (
                <span className="ml-2 text-[13px] text-muted-light">Updating…</span>
              )}
            </p>
            <div className="flex w-full items-center gap-2.5 max-[600px]:justify-between">
              <span className="font-sans text-[13px] text-muted-light">Sort by</span>
              <select
                value={filters.sort}
                onChange={(e) =>
                  patch({ sort: e.target.value as TourFilters["sort"] })
                }
                className="min-h-[44px] cursor-pointer rounded-lg border border-ink/15 bg-white px-3.5 py-[9px] font-sans text-[13.5px] font-medium text-ink outline-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tours.length > 0 ? (
            <div
              className={`grid grid-cols-3 gap-[26px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 ${
                pending ? "opacity-60" : ""
              }`}
            >
              {tours.map((t) => (
                <TourCard key={t.id} tour={t} isFavorite={t.isFavorite} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-[60px] px-[30px] text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)] max-[640px]:p-10 max-[640px]:px-6">
              <div className="mb-3.5 flex justify-center text-green">
                <Icon name="compass" size={40} strokeWidth={1.5} />
              </div>
              <h3 className="m-0 mb-2 font-serif text-[24px] font-semibold text-ink max-[640px]:text-[20px]">
                No tours match your filters
              </h3>
              <p className="m-0 mb-[22px] text-[15px] text-muted">
                Try widening your price range or clearing a filter.
              </p>
              <button
                type="button"
                onClick={reset}
                className="min-h-[44px] rounded-lg bg-green px-7 py-3 font-sans text-[14px] font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileDrawer}
    </div>
  );
}
