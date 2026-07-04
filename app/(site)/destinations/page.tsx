import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui";
import { getDestinations, getFeaturedDestination, getSiteContent } from "@/lib/queries";
import { DEFAULT_DESTINATIONS_PAGE, resolveBlock } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Destinations",
  description:
    "Six signature Caribbean destinations, each with its own rhythm. Find the one that calls to you.",
  path: "/destinations",
});

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

export default async function DestinationsPage() {
  const [destinations, featured, content] = await Promise.all([
    getDestinations(),
    getFeaturedDestination(),
    getSiteContent(),
  ]);
  const page = resolveBlock(content, "destinations_page", DEFAULT_DESTINATIONS_PAGE);

  return (
    <div>
      {/* HERO */}
      <section
        className="relative flex min-h-[440px] items-center px-8 py-[90px] max-[640px]:px-[22px]"
        style={{
          background: `linear-gradient(120deg,rgba(15,42,58,0.78),rgba(15,76,117,0.45)),url('${HERO_IMAGE}') center/cover`,
        }}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          <Eyebrow>{page.hero_eyebrow}</Eyebrow>
          <h1 className="m-0 mb-3 mt-3 max-w-[680px] font-serif text-[50px] font-bold leading-[1.08] text-sand max-[640px]:text-[34px]">
            {page.hero_headline}
          </h1>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-sand/90">
            {page.hero_description}
          </p>
        </div>
      </section>

      {/* FEATURED DESTINATION */}
      {featured && (
        <section className="mx-auto max-w-[1280px] px-8 pb-10 pt-20 max-[640px]:px-[22px]">
          <Reveal>
            <div className="grid grid-cols-[1.1fr_1fr] overflow-hidden rounded-[18px] shadow-[0_10px_40px_rgba(15,76,117,0.12)] max-[980px]:grid-cols-1">
              <div
                className="min-h-[420px] max-[980px]:min-h-[300px]"
                style={{ background: `url('${featured.hero_image_url}') center/cover` }}
              />
              <div className="flex flex-col justify-center bg-white p-7 sm:p-12 sm:px-11">
                <Eyebrow className="!text-[12px]">Featured Island</Eyebrow>
                <h2 className="m-0 mb-4 mt-2.5 font-serif text-[38px] font-bold leading-[1.1] text-ink">
                  {featured.name}
                </h2>
                <p className="m-0 mb-[26px] text-[15.5px] leading-[1.75] text-ink-soft">
                  {featured.long_description ?? featured.description}
                </p>
                <div className="mb-[30px] flex flex-wrap gap-7">
                  <Stat big={String(featured.signature_tours)} label="Signature tours" />
                  {featured.avg_temp && <Stat big={featured.avg_temp} label="Avg. temperature" />}
                  {featured.best_season && <Stat big={featured.best_season} label="Best season" />}
                </div>
                <Link
                  href={`/tours?dest=${featured.slug}`}
                  className="self-start rounded-lg bg-green px-[30px] py-3.5 font-sans text-[15px] font-semibold text-sand no-underline transition-colors hover:bg-green-dark"
                >
                  Explore {featured.name} tours
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* GRID */}
      <section className="mx-auto max-w-[1280px] px-8 pb-20 pt-10 max-[640px]:px-[22px]">
        <h2 className="m-0 mb-[30px] text-center font-serif text-[32px] font-bold text-ink">
          {page.grid_headline}
        </h2>
        <div className="grid grid-cols-3 gap-6 max-[980px]:grid-cols-2 max-[600px]:grid-cols-1">
          {destinations.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.06}>
              <Link
                href={`/tours?dest=${d.slug}`}
                className="relative block h-[380px] overflow-hidden rounded-2xl no-underline shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_40px_rgba(15,76,117,0.22)]"
                style={{ background: `url('${d.hero_image_url}') center/cover` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,42,58,0.05)] from-[30%] to-[rgba(15,42,58,0.9)]" />
                <span className="absolute left-4 top-4 rounded-md bg-gold px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.5px] text-blue">
                  {d.tag}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-[26px]">
                  <h3 className="m-0 mb-2 font-serif text-[26px] font-bold text-sand">
                    {d.name}
                  </h3>
                  <p className="m-0 mb-3 text-[14px] leading-[1.55] text-sand/[0.88]">
                    {d.description}
                  </p>
                  <span className="font-sans text-[13px] font-semibold text-gold">Explore →</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{ background: "linear-gradient(120deg,#0F4C75,#1B7A5C)" }}>
        <div className="mx-auto max-w-[1000px] px-8 py-[70px] text-center max-[640px]:px-[22px]">
          <h2 className="m-0 mb-3 font-serif text-[34px] font-bold text-sand">
            {page.cta_headline}
          </h2>
          <p className="mx-auto m-0 mb-7 max-w-[540px] text-[16px] text-sand/[0.88]">
            {page.cta_description}
          </p>
          <Link
            href={page.cta_href}
            className="inline-block rounded-lg bg-gold px-9 py-[15px] font-sans text-[16px] font-semibold text-green no-underline transition-transform hover:-translate-y-0.5"
          >
            {page.cta_label}
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-[24px] font-bold text-green">{big}</div>
      <div className="font-sans text-[12.5px] text-muted-light">{label}</div>
    </div>
  );
}
