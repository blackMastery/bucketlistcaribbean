import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AtSign,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  Gem,
  Globe,
  Heart,
  LayoutDashboard,
  Leaf,
  Mail,
  Mails,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Palmtree,
  Pencil,
  Phone,
  Quote,
  Send,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";

export type IconName =
  | "layout-dashboard"
  | "sparkles"
  | "map-pin"
  | "quote"
  | "users"
  | "star"
  | "pencil"
  | "compass"
  | "mail"
  | "mails"
  | "at-sign"
  | "phone"
  | "message-circle"
  | "instagram"
  | "facebook"
  | "shield"
  | "leaf"
  | "gem"
  | "palmtree"
  | "heart"
  | "x"
  | "menu"
  | "sliders-horizontal"
  | "chevron-left"
  | "chevron-right"
  | "external-link"
  | "inbox"
  | "smile"
  | "check"
  | "minus"
  | "clock"
  | "file-text"
  | "send";

const ICONS: Record<IconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  sparkles: Sparkles,
  "map-pin": MapPin,
  quote: Quote,
  users: Users,
  star: Star,
  pencil: Pencil,
  compass: Compass,
  mail: Mail,
  mails: Mails,
  "at-sign": AtSign,
  phone: Phone,
  "message-circle": MessageCircle,
  instagram: Camera,
  facebook: Globe,
  shield: Shield,
  leaf: Leaf,
  gem: Gem,
  palmtree: Palmtree,
  heart: Heart,
  x: X,
  menu: Menu,
  "sliders-horizontal": SlidersHorizontal,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "external-link": ExternalLink,
  inbox: FileText,
  smile: Smile,
  check: Check,
  minus: Minus,
  clock: Clock,
  "file-text": FileText,
  send: Send,
};

/** Maps legacy emoji / unicode glyphs stored in CMS or older code to lucide names. */
const LEGACY_ICONS: Record<string, IconName> = {
  "▥": "layout-dashboard",
  "✦": "sparkles",
  "◉": "map-pin",
  "❝": "quote",
  "☺": "smile",
  "★": "star",
  "✎": "pencil",
  "🧭": "compass",
  "✉": "mail",
  "📧": "mails",
  "@": "at-sign",
  "👥": "users",
  "☎": "phone",
  WA: "message-circle",
  IG: "instagram",
  FB: "facebook",
  TA: "map-pin",
  "🛡": "shield",
  "🌿": "leaf",
  "❖": "gem",
  "🌴": "palmtree",
  "♡": "heart",
  "♥": "heart",
  "×": "x",
  "☰": "menu",
  "‹": "chevron-left",
  "›": "chevron-right",
  "↗": "external-link",
  "◆": "map-pin",
  "✓": "check",
  "⏱": "clock",
  "—": "minus",
};

export function resolveIconName(name: string): IconName | null {
  const trimmed = name.trim();
  if (trimmed in ICONS) return trimmed as IconName;
  if (trimmed in LEGACY_ICONS) return LEGACY_ICONS[trimmed];
  return null;
}

export type IconProps = Omit<LucideProps, "ref"> & {
  name: string;
};

export function Icon({ name, className, size = 24, strokeWidth = 2, ...props }: IconProps) {
  const resolved = resolveIconName(name);
  if (!resolved) return null;
  const Comp = ICONS[resolved];
  return (
    <Comp
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
}

export function Stars({
  count = 5,
  className = "",
  size = 14,
  filled = true,
}: {
  count?: number;
  className?: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Star
          key={i}
          size={size}
          className="text-gold"
          fill={filled ? "currentColor" : "none"}
          strokeWidth={filled ? 0 : 2}
        />
      ))}
    </span>
  );
}

export function StarRating({
  rating,
  max = 5,
  className = "",
  size = 13,
}: {
  rating: number;
  max?: number;
  className?: string;
  size?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className="text-gold"
          fill={i < rounded ? "currentColor" : "none"}
          strokeWidth={i < rounded ? 0 : 2}
        />
      ))}
    </span>
  );
}

/** Strips star glyphs from CMS rating strings like "★ 4.9" or "4.9★". */
export function parseRatingText(text: string): string {
  return text.replace(/★/g, "").trim();
}

/** Renders CMS stat strings that may include a trailing star, e.g. "4.9★". */
export function StatBig({ value, starSize = 20 }: { value: string; starSize?: number }) {
  if (value.includes("★")) {
    return (
      <span className="inline-flex items-center gap-1">
        {parseRatingText(value)}
        <Icon name="star" size={starSize} fill="currentColor" strokeWidth={0} />
      </span>
    );
  }
  return <>{value}</>;
}
