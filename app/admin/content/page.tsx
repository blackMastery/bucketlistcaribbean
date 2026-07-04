import { requirePageAccess } from "@/lib/admin";
import { PageHeader, Card } from "@/components/admin/ui";
import {
  ObjectBlockEditor,
  ArrayBlockEditor,
  PaymentTermsBlockEditor,
} from "@/components/admin/ContentEditors";
import { getSiteContent } from "@/lib/queries";
import {
  DEFAULT_ABOUT_PAGE,
  DEFAULT_BUSINESS_CONTACT,
  DEFAULT_CONTACT_PAGE,
  DEFAULT_DESTINATIONS_PAGE,
  DEFAULT_FOOTER,
  DEFAULT_HOME_DESTINATIONS,
  DEFAULT_HOME_FEATURED_TOURS,
  DEFAULT_HOME_TESTIMONIALS,
  DEFAULT_HOME_WHY_CHOOSE,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_TOURS_PAGE,
} from "@/lib/site-content";
import type { PaymentTerms } from "@/lib/database.types";

type Obj = Record<string, string>;

export default async function AdminContentPage() {
  await requirePageAccess("content");
  const content = await getSiteContent();
  const get = <T,>(key: string, fallback: T): T =>
    (content[key] as T | undefined) ?? fallback;

  return (
    <div>
      <PageHeader title="Site content" subtitle="Edit the brand copy blocks shown across the marketing site." />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="m-0 mb-1 font-serif text-[20px] font-semibold text-ink">Business contact</h2>
          <p className="m-0 mb-4 text-[13px] text-muted-light">
            Phone, email, WhatsApp, address, and hours — used on the contact page, footer, and WhatsApp button.
          </p>
          <ObjectBlockEditor
            contentKey="business_contact"
            fields={[
              { name: "phone", label: "Phone (display)" },
              { name: "phone_href", label: "Phone link (tel:)" },
              { name: "email", label: "Email" },
              { name: "whatsapp_href", label: "WhatsApp link" },
              { name: "whatsapp_label", label: "WhatsApp label (contact page)" },
              { name: "whatsapp_short_label", label: "WhatsApp label (tour sidebar)" },
              { name: "whatsapp_footer_label", label: "WhatsApp label (footer)" },
              { name: "office", label: "Office (contact page)" },
              { name: "address_line1", label: "Address line 1 (footer)" },
              { name: "address_line2", label: "Address line 2 (footer)" },
              { name: "map_label", label: "Map pin label" },
              { name: "hours", label: "Hours of operation", textarea: true },
            ]}
            initial={get<Obj>("business_contact", DEFAULT_BUSINESS_CONTACT as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Social links</h2>
          <ArrayBlockEditor
            contentKey="social_links"
            fields={[
              { name: "label", label: "Label" },
              { name: "icon", label: "Icon" },
              { name: "href", label: "URL" },
            ]}
            initial={get<Obj[]>("social_links", DEFAULT_SOCIAL_LINKS as unknown as Obj[])}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Footer</h2>
          <ObjectBlockEditor
            contentKey="footer"
            fields={[
              { name: "tagline", label: "Tagline", textarea: true },
              { name: "copyright", label: "Copyright" },
              { name: "terms_label", label: "Terms label" },
              { name: "terms_href", label: "Terms href" },
              { name: "privacy_label", label: "Privacy label" },
              { name: "privacy_href", label: "Privacy href" },
              { name: "sitemap_label", label: "Sitemap label" },
              { name: "sitemap_href", label: "Sitemap href" },
            ]}
            initial={get<Obj>("footer", DEFAULT_FOOTER as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-1 font-serif text-[20px] font-semibold text-ink">Payment terms (default)</h2>
          <p className="m-0 mb-4 text-[13px] text-muted-light">
            Applies to every tour unless a tour overrides it on its own page.
          </p>
          <PaymentTermsBlockEditor
            initial={get<PaymentTerms | null>("payment_terms", null)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Promo banner</h2>
          <ObjectBlockEditor
            contentKey="promo_banner"
            fields={[
              { name: "strong", label: "Bold prefix" },
              { name: "text", label: "Message" },
              { name: "cta_label", label: "Link label" },
              { name: "cta_href", label: "Link href" },
            ]}
            initial={get<Obj>("promo_banner", {})}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Home hero</h2>
          <ObjectBlockEditor
            contentKey="home_hero"
            fields={[
              { name: "badge_rating", label: "Badge rating" },
              { name: "badge_text", label: "Badge text" },
              { name: "headline", label: "Headline" },
              { name: "description", label: "Description", textarea: true },
              { name: "primary_cta_label", label: "Primary button label" },
              { name: "primary_cta_href", label: "Primary button href" },
              { name: "secondary_cta_label", label: "Secondary button label" },
              { name: "secondary_cta_href", label: "Secondary button href" },
            ]}
            initial={get<Obj>("home_hero", {})}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Home — featured tours</h2>
          <ObjectBlockEditor
            contentKey="home_featured_tours"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
              { name: "description", label: "Description", textarea: true },
              { name: "cta_label", label: "Button label" },
              { name: "cta_href", label: "Button href" },
            ]}
            initial={get<Obj>("home_featured_tours", DEFAULT_HOME_FEATURED_TOURS as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Home — why choose</h2>
          <ObjectBlockEditor
            contentKey="home_why_choose"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
            ]}
            initial={get<Obj>("home_why_choose", DEFAULT_HOME_WHY_CHOOSE as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Home — destinations teaser</h2>
          <ObjectBlockEditor
            contentKey="home_destinations"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
              { name: "link_label", label: "Link label" },
              { name: "link_href", label: "Link href" },
            ]}
            initial={get<Obj>("home_destinations", DEFAULT_HOME_DESTINATIONS as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Home — testimonials</h2>
          <ObjectBlockEditor
            contentKey="home_testimonials"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
            ]}
            initial={get<Obj>("home_testimonials", DEFAULT_HOME_TESTIMONIALS as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Hero stats</h2>
          <ArrayBlockEditor
            contentKey="hero_stats"
            fields={[
              { name: "num", label: "Number" },
              { name: "label", label: "Label" },
            ]}
            initial={get<Obj[]>("hero_stats", [])}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Why-choose pillars</h2>
          <ArrayBlockEditor
            contentKey="pillars"
            fields={[
              { name: "icon", label: "Icon name (e.g. compass, shield, leaf)" },
              { name: "title", label: "Title" },
              { name: "body", label: "Body", textarea: true },
            ]}
            initial={get<Obj[]>("pillars", [])}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Contact page</h2>
          <ObjectBlockEditor
            contentKey="contact_page"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
              { name: "description", label: "Description", textarea: true },
              { name: "info_heading", label: "Contact card heading" },
              { name: "hours_heading", label: "Hours heading" },
            ]}
            initial={get<Obj>("contact_page", DEFAULT_CONTACT_PAGE as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">About page</h2>
          <ObjectBlockEditor
            contentKey="about_page"
            fields={[
              { name: "hero_eyebrow", label: "Hero eyebrow" },
              { name: "hero_headline", label: "Hero headline" },
              { name: "hero_description", label: "Hero description", textarea: true },
              { name: "story_eyebrow", label: "Story eyebrow" },
              { name: "story_headline", label: "Story headline" },
              { name: "story_p1", label: "Story paragraph 1", textarea: true },
              { name: "story_p2", label: "Story paragraph 2", textarea: true },
              { name: "values_eyebrow", label: "Values eyebrow" },
              { name: "values_headline", label: "Values headline" },
              { name: "team_eyebrow", label: "Team eyebrow" },
              { name: "team_headline", label: "Team headline" },
              { name: "certs_label", label: "Certifications label" },
            ]}
            initial={get<Obj>("about_page", DEFAULT_ABOUT_PAGE as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">About values</h2>
          <ArrayBlockEditor
            contentKey="values"
            fields={[
              { name: "icon", label: "Icon name (e.g. compass, shield, leaf)" },
              { name: "title", label: "Title" },
              { name: "body", label: "Body", textarea: true },
            ]}
            initial={get<Obj[]>("values", [])}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Destinations page</h2>
          <ObjectBlockEditor
            contentKey="destinations_page"
            fields={[
              { name: "hero_eyebrow", label: "Hero eyebrow" },
              { name: "hero_headline", label: "Hero headline" },
              { name: "hero_description", label: "Hero description", textarea: true },
              { name: "grid_headline", label: "Grid headline" },
              { name: "cta_headline", label: "CTA headline" },
              { name: "cta_description", label: "CTA description", textarea: true },
              { name: "cta_label", label: "CTA button label" },
              { name: "cta_href", label: "CTA button href" },
            ]}
            initial={get<Obj>("destinations_page", DEFAULT_DESTINATIONS_PAGE as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Tours page</h2>
          <ObjectBlockEditor
            contentKey="tours_page"
            fields={[
              { name: "eyebrow", label: "Eyebrow" },
              { name: "headline", label: "Headline" },
              { name: "description", label: "Description", textarea: true },
            ]}
            initial={get<Obj>("tours_page", DEFAULT_TOURS_PAGE as unknown as Obj)}
          />
        </Card>

        <Card>
          <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">Certifications</h2>
          <ArrayBlockEditor
            contentKey="certs"
            fields={[
              { name: "big", label: "Headline" },
              { name: "label", label: "Caption" },
            ]}
            initial={get<Obj[]>("certs", [])}
          />
        </Card>
      </div>
    </div>
  );
}
