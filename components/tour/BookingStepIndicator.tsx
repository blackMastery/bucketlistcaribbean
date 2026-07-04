"use client";

export function BookingStepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <li
              key={label}
              className="flex flex-1 items-center last:flex-none"
              aria-current={isActive ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-sans text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-green text-sand"
                      : isCompleted
                        ? "bg-green/[0.15] text-green"
                        : "bg-ink/[0.06] text-muted-light"
                  }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </span>
                <span
                  className={`hidden text-center font-sans text-[11px] font-semibold uppercase tracking-[0.5px] min-[480px]:block ${
                    isActive ? "text-green" : isCompleted ? "text-ink-soft" : "text-muted-light"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 min-[480px]:mb-0 ${
                    isCompleted ? "bg-green/40" : "bg-ink/[0.08]"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
