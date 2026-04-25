"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddModelErrorPanel } from "@/components/add-model-error-panel";
import type { AddModelFailure } from "@/lib/add-model-failure";
import { buildLoadTargetFailure, parseAddModelApiFailure } from "@/lib/add-model-failure";

const ORG_MODEL_RE = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

function hasModelLoadTarget(hf: string, local: string, source: string) {
  if (hf.trim() || local.trim()) return true;
  if (source.trim() && ORG_MODEL_RE.test(source.trim())) return true;
  return false;
}

type Props = { className?: string };

export function AddModelForm({ className: wrapClassName }: Props) {
  const r = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [source, setSource] = useState("");
  const [hfModelId, setHfModelId] = useState("");
  const [localModelPath, setLocalModelPath] = useState("");
  const [slug, setSlug] = useState("");
  const [failure, setFailure] = useState<AddModelFailure | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFailure() {
    setFailure(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);
    if (!hasModelLoadTarget(hfModelId, localModelPath, source)) {
      setFailure(buildLoadTargetFailure());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          source: source.trim() || undefined,
          hfModelId: hfModelId.trim() || undefined,
          localModelPath: localModelPath.trim() || undefined,
          slug: slug.trim() || undefined,
        }),
      });
      const rawText = await res.text();
      let data: unknown = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText) as unknown;
        } catch {
          data = { error: rawText || res.statusText };
        }
      }
      if (!res.ok) {
        setFailure(parseAddModelApiFailure(res.status, data));
        return;
      }
      const j = data as { data?: { id: string } };
      if (j.data) r.push("/dashboard/models/" + j.data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFailure(parseAddModelApiFailure(0, { error: message }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={["w-full rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8", wrapClassName].filter(Boolean).join(" ")}
    >
      {failure ? (
        <div className="mb-6">
          <AddModelErrorPanel failure={failure} onDismiss={clearFailure} />
        </div>
      ) : null}
      <div className="mb-6 border-b border-border/50 pb-5">
        <h3 className="font-display text-lg font-bold text-foreground">Register model</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          At least one load target is required: Hugging Face id, local path, or Source as org/model.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Display name (required)</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => {
              clearFailure();
              setDisplayName(e.target.value);
            }}
            required
            placeholder="e.g. Qwen1.5-0.5B"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Hugging Face model id (optional if Source or local is set)</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            value={hfModelId}
            onChange={(e) => {
              clearFailure();
              setHfModelId(e.target.value);
            }}
            placeholder="e.g. Qwen/Qwen1.5-0.5B-Chat"
          />
          <p className="mt-1 text-xs text-muted-foreground">You can use Source as org/model instead.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Local model folder (optional if HF or org/model is set)</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            value={localModelPath}
            onChange={(e) => {
              clearFailure();
              setLocalModelPath(e.target.value);
            }}
            placeholder="Path on the machine running the worker (HF-style directory)"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Source (optional)</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={source}
            onChange={(e) => {
              clearFailure();
              setSource(e.target.value);
            }}
            placeholder="Label, or org/model for Hub"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Slug (optional, auto if empty)</label>
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            value={slug}
            onChange={(e) => {
              clearFailure();
              setSlug(e.target.value);
            }}
            placeholder="my-model"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Saving" + String.fromCharCode(8230) : "Register model"}
          </button>
        </div>
      </div>
    </form>
  );
}
