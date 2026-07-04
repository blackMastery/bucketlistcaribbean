"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FormLabel } from "@/components/admin/ui";

// Uploads an image to the public "media" Storage bucket (admin RLS) and returns
// its public URL. Also accepts a pasted URL as a fallback.
export function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  label = "Image",
  required = false,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  required?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <FormLabel required={required}>{label}</FormLabel>
      <div className="flex items-start gap-4">
        <div className="relative h-[88px] w-[120px] shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-cream">
          {value ? (
            <Image src={value} alt="" fill className="object-cover" sizes="120px" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-muted-light">
              No image
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={busy}
            className="block w-full text-[13px] text-muted file:mr-3 file:rounded-md file:border-0 file:bg-green file:px-3 file:py-2 file:font-sans file:text-[13px] file:font-semibold file:text-white hover:file:bg-green-dark"
          />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-green"
          />
          {busy && <p className="m-0 mt-1.5 text-[12px] text-green">Uploading…</p>}
          {error && <p className="m-0 mt-1.5 text-[12px] text-coral">{error}</p>}
        </div>
      </div>
    </div>
  );
}
