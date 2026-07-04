"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { inputCls, labelCls, btnPrimary } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import {
  addTourImage,
  deleteTourImage,
  addHighlight,
  deleteHighlight,
  addItineraryDay,
  deleteItineraryDay,
  addInclusion,
  deleteInclusion,
  setTourActivities,
} from "@/app/admin/actions";
import type {
  TourImage,
  TourHighlight,
  TourItinerary,
  TourInclusion,
} from "@/lib/database.types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/[0.06] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h3 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

const rowCls =
  "flex items-center gap-3 rounded-lg border border-ink/10 bg-cream/40 px-3.5 py-2.5";

// --- Images -----------------------------------------------------------------
export function TourImagesEditor({
  tourId,
  images,
}: {
  tourId: string;
  images: TourImage[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [inCarousel, setInCarousel] = useState(true);
  const [pending, start] = useTransition();

  return (
    <Section title="Gallery images">
      <div className="mb-4 flex flex-col gap-2">
        {images.length === 0 && (
          <p className="m-0 text-[13px] text-muted-light">
            No images yet — the card image is used as a fallback.
          </p>
        )}
        {images.map((im) => (
          <div key={im.id} className={rowCls}>
            <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded">
              <Image src={im.url} alt="" fill className="object-cover" sizes="56px" />
            </span>
            <span className="flex-1 truncate text-[12px] text-muted">{im.url}</span>
            <span className="rounded bg-ink/[0.06] px-2 py-0.5 text-[11px] text-muted">
              {im.in_carousel ? "carousel" : "gallery"}
            </span>
            <ConfirmButton
              title="Remove image?"
              confirmText="This image will be removed from the tour gallery."
              disabled={pending}
              onConfirm={async () => {
                await deleteTourImage(im.id);
                router.refresh();
              }}
            >
              Remove
            </ConfirmButton>
          </div>
        ))}
      </div>
      <ImageUploader label="Add image" folder="tours" value={url} onChange={setUrl} />
      <label className="mt-3 flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          className="h-4 w-4 accent-green"
          checked={inCarousel}
          onChange={(e) => setInCarousel(e.target.checked)}
        />
        Show in the top carousel
      </label>
      <div className="mt-3">
        <button
          className={btnPrimary}
          disabled={pending || !url}
          onClick={() =>
            start(async () => {
              await addTourImage(tourId, url, inCarousel);
              setUrl("");
              router.refresh();
            })
          }
        >
          Add image
        </button>
      </div>
    </Section>
  );
}

// --- Highlights -------------------------------------------------------------
export function TourHighlightsEditor({
  tourId,
  highlights,
}: {
  tourId: string;
  highlights: TourHighlight[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  return (
    <Section title="Trip highlights">
      <div className="mb-4 flex flex-col gap-2">
        {highlights.map((h) => (
          <div key={h.id} className={rowCls}>
            <span className="flex-1 text-[14px] text-ink-soft">{h.text}</span>
            <ConfirmButton
              title="Remove highlight?"
              confirmText="This highlight will be removed from the tour."
              disabled={pending}
              onConfirm={async () => {
                await deleteHighlight(h.id);
                router.refresh();
              }}
            >
              Remove
            </ConfirmButton>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <input
          className={inputCls}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a highlight…"
        />
        <button
          className={btnPrimary}
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              await addHighlight(tourId, text.trim());
              setText("");
              router.refresh();
            })
          }
        >
          Add
        </button>
      </div>
    </Section>
  );
}

// --- Itinerary --------------------------------------------------------------
export function TourItineraryEditor({
  tourId,
  days,
}: {
  tourId: string;
  days: TourItinerary[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <Section title="Itinerary">
      <div className="mb-4 flex flex-col gap-2">
        {days.map((d) => (
          <div key={d.id} className="rounded-lg border border-ink/10 bg-cream/40 p-3.5">
            <div className="flex items-center gap-3">
              <span className="rounded bg-green px-2 py-0.5 font-sans text-[11px] font-bold text-white">
                DAY {d.day_number}
              </span>
              <span className="flex-1 font-sans text-[14px] font-semibold text-ink">
                {d.title}
              </span>
              <ConfirmButton
                title="Remove itinerary day?"
                confirmText={`Day ${d.day_number} (${d.title}) will be permanently removed.`}
                disabled={pending}
                onConfirm={async () => {
                  await deleteItineraryDay(d.id);
                  router.refresh();
                }}
              >
                Remove
              </ConfirmButton>
            </div>
            <p className="m-0 mt-1.5 text-[13px] leading-[1.6] text-muted">{d.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Day title (e.g. Arrival & Sunset Welcome)"
        />
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What happens this day…"
        />
        <div>
          <button
            className={btnPrimary}
            disabled={pending || !title.trim() || !body.trim()}
            onClick={() =>
              start(async () => {
                await addItineraryDay(tourId, title.trim(), body.trim());
                setTitle("");
                setBody("");
                router.refresh();
              })
            }
          >
            Add day
          </button>
        </div>
      </div>
    </Section>
  );
}

// --- Inclusions -------------------------------------------------------------
export function TourInclusionsEditor({
  tourId,
  inclusions,
}: {
  tourId: string;
  inclusions: TourInclusion[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"included" | "excluded">("included");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const included = inclusions.filter((i) => i.kind === "included");
  const excluded = inclusions.filter((i) => i.kind === "excluded");

  const list = (rows: TourInclusion[], iconName: "check" | "x") => (
    <div className="flex flex-col gap-2">
      {rows.map((i) => (
        <div key={i.id} className={rowCls}>
          <Icon
            name={iconName}
            size={14}
            className={iconName === "check" ? "text-green" : "text-[#B0524A]"}
            strokeWidth={3}
          />
          <span className="flex-1 text-[14px] text-ink-soft">{i.text}</span>
          <ConfirmButton
            title="Remove item?"
            confirmText={`"${i.text}" will be removed from the ${i.kind === "included" ? "included" : "not included"} list.`}
            disabled={pending}
            onConfirm={async () => {
              await deleteInclusion(i.id);
              router.refresh();
            }}
          >
            Remove
          </ConfirmButton>
        </div>
      ))}
    </div>
  );

  return (
    <Section title="What's included / not included">
      <div className="mb-4 grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div>
          <p className="mb-2 font-sans text-[13px] font-semibold text-green">Included</p>
          {list(included, "check")}
        </div>
        <div>
          <p className="mb-2 font-sans text-[13px] font-semibold text-[#B0524A]">Not included</p>
          {list(excluded, "x")}
        </div>
      </div>
      <div className="flex gap-3 max-[700px]:flex-col">
        <select className={`${inputCls} max-w-[160px]`} value={kind} onChange={(e) => setKind(e.target.value as "included" | "excluded")}>
          <option value="included">Included</option>
          <option value="excluded">Not included</option>
        </select>
        <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item…" />
        <button
          className={btnPrimary}
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              await addInclusion(tourId, kind, text.trim());
              setText("");
              router.refresh();
            })
          }
        >
          Add
        </button>
      </div>
    </Section>
  );
}

// --- Activities -------------------------------------------------------------
export function TourActivitiesEditor({
  tourId,
  options,
  selected,
}: {
  tourId: string;
  options: { id: string; name: string }[];
  selected: string[];
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(selected));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <Section title="Activity tags">
      <div className="mb-4 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = sel.has(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className={`rounded-full border px-4 py-2 font-sans text-[13px] font-semibold transition-colors ${
                on
                  ? "border-green bg-green text-white"
                  : "border-ink/15 bg-white text-ink hover:border-green"
              }`}
            >
              {o.name}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button
          className={btnPrimary}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setTourActivities(tourId, Array.from(sel));
              setSaved(true);
              router.refresh();
            })
          }
        >
          {pending ? "Saving…" : "Save tags"}
        </button>
        {saved && <span className="text-[13px] text-green">Saved.</span>}
      </div>
    </Section>
  );
}
