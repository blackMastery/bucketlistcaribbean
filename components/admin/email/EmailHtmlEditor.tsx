"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMAIL_VARIABLES } from "@/lib/email/variables";
import { buildSampleVars } from "@/lib/email/variables";
import { renderTemplate, type EmailBrand } from "@/lib/email/render";
import { formatPrice } from "@/lib/format";
import { btnGhost, inputCls } from "@/components/admin/ui";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import "react-quill-new/dist/quill.snow.css";

type EmailHtmlEditorProps = {
  name: string;
  defaultValue?: string;
  subject: string;
  brand: EmailBrand;
  onChange?: (html: string) => void;
};

export function EmailHtmlEditor({
  name,
  defaultValue = "",
  subject,
  brand,
  onChange,
}: EmailHtmlEditorProps) {
  const [html, setHtml] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(true);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = html;
    onChange?.(html);
  }, [html, onChange]);

  const insertVariable = useCallback(
    (key: string) => {
      setHtml((prev) => prev + `{{${key}}}`);
    },
    [],
  );

  const preview = renderTemplate(
    { subject, body_html: html },
    buildSampleVars(formatPrice),
    brand,
  );

  return (
    <div className="flex flex-col gap-4">
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />

      <div className="flex flex-wrap gap-2">
        <span className="self-center font-sans text-[12px] font-semibold text-muted">
          Insert variable:
        </span>
        {EMAIL_VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => insertVariable(v.key)}
            className="rounded-md border border-ink/15 bg-sand/50 px-2 py-1 font-mono text-[11px] text-ink transition-colors hover:border-green hover:text-green"
            title={v.description}
          >
            {`{{${v.key}}}`}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/15 bg-white [&_.ql-toolbar]:border-ink/10 [&_.ql-container]:min-h-[200px] [&_.ql-editor]:min-h-[200px]">
        <ReactQuill theme="snow" value={html} onChange={setHtml} />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className={btnGhost}
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      {showPreview && (
        <div className="overflow-hidden rounded-lg border border-ink/15">
          <div className="border-b border-ink/10 bg-sand/40 px-4 py-2 text-[12px] text-muted">
            Preview subject: <strong className="text-ink">{preview.subject}</strong>
          </div>
          <iframe
            title="Email preview"
            srcDoc={preview.html}
            className="h-[480px] w-full border-0 bg-white"
            sandbox=""
          />
        </div>
      )}
    </div>
  );
}
