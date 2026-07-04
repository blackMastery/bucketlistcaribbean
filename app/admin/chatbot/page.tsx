import { Suspense } from "react";
import Link from "next/link";
import { requirePageAccess } from "@/lib/admin";
import {
  PageHeader,
  Card,
  LinkButton,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ChatbotTabs } from "@/components/admin/ChatbotTabs";
import { FaqCategoryManager } from "@/components/admin/FaqCategoryManager";
import { FaqActiveToggle } from "@/components/admin/FaqActiveToggle";
import {
  getAdminFaqs,
  getFaqCategories,
  getAdminChatbotConversations,
} from "@/lib/admin-queries";
import { deleteFaq, deleteConversation } from "@/app/admin/chatbot/actions";

export default async function AdminChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  await requirePageAccess("chatbot");
  const { tab, q } = await searchParams;
  const activeTab = tab === "conversations" ? "conversations" : "faqs";
  const [faqs, categories, conversations] = await Promise.all([
    getAdminFaqs(),
    getFaqCategories(),
    getAdminChatbotConversations(q),
  ]);

  return (
    <div>
      <PageHeader
        title="Chatbot"
        subtitle="FAQ knowledge base and conversation log for the site chat assistant"
        action={
          activeTab === "faqs" ? (
            <LinkButton href="/admin/chatbot/faqs/new">+ New FAQ</LinkButton>
          ) : undefined
        }
      />
      <Suspense>
        <ChatbotTabs
          counts={{ faqs: faqs.length, conversations: conversations.length }}
        />
      </Suspense>

      {activeTab === "faqs" ? (
        <div className="flex flex-col gap-6">
          {faqs.length === 0 ? (
            <EmptyState
              icon="message-circle"
              text="No FAQs yet. Apply migration 0015 to seed the starter set, or create one."
            />
          ) : (
            <Card className="!p-0">
              <div className="divide-y divide-ink/[0.06]">
                {faqs.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/chatbot/faqs/${f.id}`}
                        className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green"
                      >
                        {f.question}
                      </Link>
                      <div className="mt-0.5 truncate text-[12.5px] text-muted">
                        {f.category_name ?? "Uncategorized"} · used {f.usage_count}×
                        {f.keywords.length > 0 && ` · ${f.keywords.join(", ")}`}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <StatusBadge status={f.is_active ? "active" : "inactive"} />
                      <FaqActiveToggle id={f.id} isActive={f.is_active} />
                      <Link
                        href={`/admin/chatbot/faqs/${f.id}`}
                        className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green"
                      >
                        Edit
                      </Link>
                      <ConfirmButton
                        action={deleteFaq.bind(null, f.id)}
                        title="Delete FAQ?"
                        confirmText={`“${f.question}” will be permanently removed. Logged conversations that matched it are kept.`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <h2 className="m-0 mb-1 font-serif text-[18px] font-bold text-ink">
              Categories
            </h2>
            <p className="m-0 mb-4 text-[13px] text-muted">
              Optional grouping for the FAQ list. Deleting a category keeps its FAQs.
            </p>
            <FaqCategoryManager categories={categories} />
          </Card>
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="message-circle"
          text={
            q
              ? "No conversations match your search."
              : "No conversations logged yet. They appear here as visitors use the chat widget."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[12.5px] text-muted">
            Showing the {conversations.length === 50 ? "latest 50" : `${conversations.length}`} most
            recent exchanges.
          </p>
          {conversations.map((c) => (
            <Card key={c.id} className="!p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] text-muted">
                  {new Date(c.created_at).toLocaleString()} · session{" "}
                  {c.session_id.slice(0, 8)}…
                </span>
                <div className="flex items-center gap-2">
                  {c.was_helpful !== null && (
                    <StatusBadge status={c.was_helpful ? "helpful" : "unhelpful"} />
                  )}
                  <ConfirmButton
                    action={deleteConversation.bind(null, c.id)}
                    title="Delete conversation entry?"
                    confirmText="This logged exchange will be permanently removed."
                    className="font-sans text-[12.5px] font-semibold text-coral hover:underline"
                  >
                    Delete
                  </ConfirmButton>
                </div>
              </div>
              <p className="mb-0 mt-3 text-[14px] text-ink">
                <span className="font-sans font-semibold">Visitor:</span> {c.user_message}
              </p>
              <p className="mb-0 mt-2 whitespace-pre-wrap text-[14px] text-ink-soft">
                <span className="font-sans font-semibold text-ink">Bot:</span> {c.bot_response}
              </p>
              {c.matched_faq_question && (
                <p className="mb-0 mt-2 text-[12.5px] text-muted">
                  Matched FAQ: &ldquo;{c.matched_faq_question}&rdquo;
                  {c.confidence_score != null && ` · confidence ${c.confidence_score}`}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
