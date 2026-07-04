import type { Metadata } from "next";
import { requirePageAccess } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Email templates",
};

export default async function EmailTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("email-templates");
  return children;
}
