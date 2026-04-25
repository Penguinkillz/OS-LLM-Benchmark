import { AddModelForm } from "@/components/add-model-form";
import { AddModelTutorial } from "@/components/add-model-tutorial";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewModelPage() {
  return (
    <div className="w-full max-w-5xl">
      <Link href="/dashboard/models" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Models
      </Link>
      <h2 className="font-display text-xl font-bold text-foreground">Add model</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Register the model the benchmark worker should load. You need a display name plus at least one of: a Hugging Face
        id, a local folder path (on the worker), or Source as <code className="font-mono text-accent">org/model</code>.
      </p>
      <div className="mt-6 flex w-full flex-col gap-10">
        <AddModelForm />
        <AddModelTutorial />
      </div>
    </div>
  );
}
