import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Sign In",
    description: "Sign in to your account.",
    path: "/login",
    noIndex: true,
  });
}

export default function LoginPage() {
  return (
    <section className="mx-auto flex max-w-[460px] flex-col px-8 py-[72px] max-[640px]:px-[22px]">
      <div className="rounded-[18px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] sm:p-10">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </section>
  );
}
