"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { FeedbackBanner, PrimaryButton, SectionCard, StatusBadge } from "@/components/ui";
import {
  initialSubmitDayActionState,
  submitTodayAction,
} from "@/app/sales/submit/actions";

export function SubmitDayPanel({
  alreadySubmitted,
  submittedAt,
  revenue,
  units,
  salesCount,
}: {
  alreadySubmitted: boolean;
  submittedAt?: string | null;
  revenue: number;
  units: number;
  salesCount: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitTodayAction,
    initialSubmitDayActionState,
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  const submitted = alreadySubmitted || state.status === "success";

  return (
    <SectionCard>
      {state.status === "success" ? (
        <FeedbackBanner title={state.title ?? "Day submitted"} body={state.message} />
      ) : null}
      {state.status === "error" ? (
        <FeedbackBanner
          title={state.title ?? "Not submitted"}
          body={state.message}
          tone="danger"
        />
      ) : null}

      <div className="mt-4 flex items-start justify-between gap-3 first:mt-0">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            {submitted ? "Today is submitted" : "Ready to submit?"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {submitted
              ? "Sales for today are locked for your account."
              : "Review the summary, then submit when your day is finished."}
          </p>
        </div>
        <StatusBadge tone={submitted ? "good" : "info"}>
          {submitted ? "Locked" : "Open"}
        </StatusBadge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Sales" value={`${salesCount}`} />
        <Summary label="Units" value={`${units}`} />
        <Summary label="Revenue" value={`GHS ${revenue.toFixed(2)}`} />
      </div>

      {submittedAt ? (
        <p className="mt-4 text-sm text-zinc-600">
          Submitted at {new Date(submittedAt).toLocaleString()}.
        </p>
      ) : null}

      {!submitted ? (
        <form action={formAction} className="mt-4">
          <PrimaryButton type="submit" disabled={pending} className="w-full sm:w-auto">
            <Lock className="h-4 w-4" aria-hidden />
            {pending ? "Submitting..." : "Submit today"}
          </PrimaryButton>
        </form>
      ) : null}
    </SectionCard>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-sm text-zinc-600">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
