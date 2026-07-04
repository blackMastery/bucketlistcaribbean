// Renders a JSON-LD structured-data script. Server component — safe to drop
// into any page body. Pass one object or an array of schema.org objects.
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
