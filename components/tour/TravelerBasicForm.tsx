"use client";

import type { TravelerDetailsInput, TravelerGender } from "@/lib/travelers";

const GENDER_OPTIONS: { value: TravelerGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unspecified", label: "Unspecified" },
];

export function TravelerBasicForm({
  label,
  value,
  onChange,
  labelCls,
  fieldCls,
}: {
  label: string;
  value: TravelerDetailsInput;
  onChange: (next: TravelerDetailsInput) => void;
  labelCls: string;
  fieldCls: string;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-cream/30 p-4">
      <div className="mb-3 font-sans text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <div>
            <label className={labelCls}>First name</label>
            <input
              type="text"
              value={value.firstName}
              onChange={(e) => onChange({ ...value, firstName: e.target.value })}
              className={fieldCls}
              placeholder="As on passport"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Last name</label>
            <input
              type="text"
              value={value.lastName}
              onChange={(e) => onChange({ ...value, lastName: e.target.value })}
              className={fieldCls}
              placeholder="As on passport"
              autoComplete="family-name"
              required
            />
          </div>
        </div>
        <p className="m-0 text-[11px] leading-[1.4] text-muted">
          Names must exactly match official government ID or passport.
        </p>
        <div>
          <label className={labelCls}>Phone number</label>
          <input
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            className={fieldCls}
            placeholder="+1 246 000 0000"
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Passport number</label>
          <input
            type="text"
            value={value.passportNumber}
            onChange={(e) => onChange({ ...value, passportNumber: e.target.value })}
            className={fieldCls}
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Date of birth</label>
          <input
            type="date"
            value={value.dateOfBirth}
            onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
            className={fieldCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <select
            value={value.gender}
            onChange={(e) =>
              onChange({ ...value, gender: e.target.value as TravelerGender })
            }
            className={`${fieldCls} cursor-pointer bg-white`}
            required
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 mb-0 text-[11px] leading-[1.4] text-muted">
            Required for secure flight screening (TSA).
          </p>
        </div>
      </div>
    </div>
  );
}

export { emptyTravelerDetails, emptyTravelerBasic } from "@/lib/travelers";
