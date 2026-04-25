import { AlertTriangle } from "lucide-react";
import type { AddModelFailure } from "@/lib/add-model-failure";

type Props = {
  failure: AddModelFailure;
  onDismiss?: () => void;
};

export function AddModelErrorPanel({ failure, onDismiss }: Props) {
  return (
    <aside
      role="alert"
      className="rounded-2xl border border-destructive/35 bg-destructive/[0.06] p-6 text-sm text-foreground shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">{failure.title}</h3>
            <p className="mt-1.5 text-muted-foreground">{failure.intro}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive/90">What went wrong</h4>
            <ul className="mt-2 space-y-3">
              {failure.issues.map((issue, i) => (
                <li key={i} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">{issue.fieldLabel}</p>
                  <p className="mt-1 text-foreground">{issue.message}</p>
                  {issue.hint ? <p className="mt-2 text-xs text-muted-foreground">{issue.hint}</p> : null}
                </li>
              ))}
            </ul>
          </div>
          {failure.technical ? (
            <details className="group rounded-lg border border-border/40 bg-background/30">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="underline decoration-border underline-offset-2 group-open:text-foreground">
                  Technical details
                </span>
              </summary>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words border-t border-border/30 px-3 py-2 font-mono text-[0.7rem] text-muted-foreground">
                {failure.technical}
              </pre>
            </details>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-medium text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
