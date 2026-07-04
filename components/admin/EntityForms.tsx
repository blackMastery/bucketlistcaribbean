"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { inputCls, FormLabel, FormRequiredNote, btnPrimary } from "@/components/admin/ui";
import {
  createDestination,
  updateDestination,
  createTestimonial,
  updateTestimonial,
  createTeamMember,
  updateTeamMember,
  type DestinationInput,
  type TestimonialInput,
  type TeamInput,
} from "@/app/admin/actions";
import type { Destination, Testimonial, TeamMember } from "@/lib/database.types";
import { slugify } from "@/lib/format";

function Saved({ msg }: { msg: string | null }) {
  return msg ? <span className="text-[13px] text-green">{msg}</span> : null;
}

// --- Destination ------------------------------------------------------------
export function DestinationForm({
  mode,
  destination,
}: {
  mode: "new" | "edit";
  destination?: Destination;
}) {
  const [f, setF] = useState({
    slug: destination?.slug ?? "",
    name: destination?.name ?? "",
    tag: destination?.tag ?? "",
    description: destination?.description ?? "",
    long_description: destination?.long_description ?? "",
    hero_image_url: destination?.hero_image_url ?? "",
    is_featured: destination?.is_featured ?? false,
    avg_temp: destination?.avg_temp ?? "",
    best_season: destination?.best_season ?? "",
    signature_tours: String(destination?.signature_tours ?? 0),
    sort_order: String(destination?.sort_order ?? 0),
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input: DestinationInput = {
      slug: f.slug.trim(),
      name: f.name.trim(),
      tag: f.tag.trim(),
      description: f.description.trim(),
      long_description: f.long_description.trim() || null,
      hero_image_url: f.hero_image_url.trim(),
      is_featured: f.is_featured,
      avg_temp: f.avg_temp.trim() || null,
      best_season: f.best_season.trim() || null,
      signature_tours: Number(f.signature_tours || 0),
      sort_order: Number(f.sort_order || 0),
    };
    start(async () => {
      if (mode === "new") await createDestination(input);
      else if (destination) {
        const r = await updateDestination(destination.id, input);
        setMsg(r.ok ? "Saved." : r.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FormRequiredNote />
      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div><FormLabel required>Name</FormLabel><input className={inputCls} value={f.name} onChange={(e) => {
          const name = e.target.value;
          setF((s) => ({
            ...s,
            name,
            ...(mode === "new" && !slugTouched ? { slug: slugify(name) } : {}),
          }));
        }} required /></div>
        <div><FormLabel required>Slug</FormLabel><input className={inputCls} value={f.slug} onChange={(e) => {
          setSlugTouched(true);
          set("slug", e.target.value);
        }} required /></div>
        <div><FormLabel required>Tag</FormLabel><input className={inputCls} value={f.tag} onChange={(e) => set("tag", e.target.value)} placeholder="Adventure & Luxury" required /></div>
        <div><FormLabel>Sort order</FormLabel><input className={inputCls} type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div>
        <div><FormLabel>Avg. temperature</FormLabel><input className={inputCls} value={f.avg_temp} onChange={(e) => set("avg_temp", e.target.value)} placeholder="82°F" /></div>
        <div><FormLabel>Best season</FormLabel><input className={inputCls} value={f.best_season} onChange={(e) => set("best_season", e.target.value)} placeholder="Nov–Apr" /></div>
        <div><FormLabel>Signature tours (count)</FormLabel><input className={inputCls} type="number" value={f.signature_tours} onChange={(e) => set("signature_tours", e.target.value)} /></div>
      </div>
      <div><FormLabel required>Short description</FormLabel><textarea className={`${inputCls} min-h-[70px] resize-y`} value={f.description} onChange={(e) => set("description", e.target.value)} required /></div>
      <div><FormLabel>Long description (featured island)</FormLabel><textarea className={`${inputCls} min-h-[110px] resize-y`} value={f.long_description} onChange={(e) => set("long_description", e.target.value)} /></div>
      <ImageUploader label="Hero image" folder="destinations" value={f.hero_image_url} onChange={(url) => set("hero_image_url", url)} required />
      <label className="flex items-center gap-2.5 text-[14px] text-ink">
        <input type="checkbox" className="h-[18px] w-[18px] accent-green" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
        Featured island (shown large on the Destinations page)
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>{pending ? "Saving…" : mode === "new" ? "Create destination" : "Save changes"}</button>
        <Saved msg={msg} />
      </div>
    </form>
  );
}

// --- Testimonial ------------------------------------------------------------
export function TestimonialForm({
  mode,
  testimonial,
}: {
  mode: "new" | "edit";
  testimonial?: Testimonial;
}) {
  const [f, setF] = useState({
    quote: testimonial?.quote ?? "",
    initials: testimonial?.initials ?? "",
    name: testimonial?.name ?? "",
    trip: testimonial?.trip ?? "",
    rating: String(testimonial?.rating ?? 5),
    sort_order: String(testimonial?.sort_order ?? 0),
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input: TestimonialInput = {
      quote: f.quote.trim(),
      initials: f.initials.trim(),
      name: f.name.trim(),
      trip: f.trip.trim(),
      rating: Number(f.rating || 5),
      sort_order: Number(f.sort_order || 0),
    };
    start(async () => {
      if (mode === "new") await createTestimonial(input);
      else if (testimonial) {
        const r = await updateTestimonial(testimonial.id, input);
        setMsg(r.ok ? "Saved." : r.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FormRequiredNote />
      <div><FormLabel required>Quote</FormLabel><textarea className={`${inputCls} min-h-[90px] resize-y`} value={f.quote} onChange={(e) => set("quote", e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div><FormLabel required>Name</FormLabel><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div><FormLabel required>Initials</FormLabel><input className={inputCls} value={f.initials} onChange={(e) => set("initials", e.target.value)} placeholder="JR" required /></div>
        <div><FormLabel required>Trip</FormLabel><input className={inputCls} value={f.trip} onChange={(e) => set("trip", e.target.value)} placeholder="Barbados Platinum Coast" required /></div>
        <div><FormLabel>Sort order</FormLabel><input className={inputCls} type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>{pending ? "Saving…" : mode === "new" ? "Create testimonial" : "Save changes"}</button>
        <Saved msg={msg} />
      </div>
    </form>
  );
}

// --- Team -------------------------------------------------------------------
export function TeamForm({
  mode,
  member,
}: {
  mode: "new" | "edit";
  member?: TeamMember;
}) {
  const [f, setF] = useState({
    name: member?.name ?? "",
    role: member?.role ?? "",
    bio: member?.bio ?? "",
    photo_url: member?.photo_url ?? "",
    sort_order: String(member?.sort_order ?? 0),
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input: TeamInput = {
      name: f.name.trim(),
      role: f.role.trim(),
      bio: f.bio.trim(),
      photo_url: f.photo_url.trim(),
      sort_order: Number(f.sort_order || 0),
    };
    start(async () => {
      if (mode === "new") await createTeamMember(input);
      else if (member) {
        const r = await updateTeamMember(member.id, input);
        setMsg(r.ok ? "Saved." : r.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FormRequiredNote />
      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div><FormLabel required>Name</FormLabel><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div><FormLabel required>Role</FormLabel><input className={inputCls} value={f.role} onChange={(e) => set("role", e.target.value)} placeholder="Lead Concierge" required /></div>
        <div><FormLabel>Sort order</FormLabel><input className={inputCls} type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div>
      </div>
      <div><FormLabel required>Bio</FormLabel><textarea className={`${inputCls} min-h-[90px] resize-y`} value={f.bio} onChange={(e) => set("bio", e.target.value)} required /></div>
      <ImageUploader label="Photo" folder="team" value={f.photo_url} onChange={(url) => set("photo_url", url)} required />
      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>{pending ? "Saving…" : mode === "new" ? "Create member" : "Save changes"}</button>
        <Saved msg={msg} />
      </div>
    </form>
  );
}
