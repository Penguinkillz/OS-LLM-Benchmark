import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { models } from "@/db/schema";
import { createModelSchema } from "@/lib/validation";
import { slugify } from "@/lib/slugify";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(models).orderBy(desc(models.createdAt));
    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "DB error" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const body = createModelSchema.parse(await req.json());
    const slug = body.slug && body.slug.length > 0 ? body.slug : slugify(body.displayName);
    const params: Record<string, unknown> = { ...(body.paramsJson ?? {}) };
    if (body.hfModelId?.trim()) params.hf_model_id = body.hfModelId.trim();
    if (body.localModelPath?.trim()) params.local_model_path = body.localModelPath.trim();
    const src = body.source?.trim() ?? "";
    if (!params.hf_model_id && src && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(src)) {
      params.hf_model_id = src;
    }
    const db = getDb();
    const [row] = await db
      .insert(models)
      .values({
        slug,
        displayName: body.displayName,
        source: body.source ?? null,
        paramsJson: params,
      })
      .returning();
    return NextResponse.json({ data: row });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Some fields did not pass validation. Review the items below and try again.",
          code: "VALIDATION" as const,
          issues: e.issues.map((issue) => ({
            path: issue.path.length ? issue.path.map(String).join(".") : "form",
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    if (e && typeof e === "object" && "code" in (e as object) && (e as { code: string }).code === "23505") {
      return NextResponse.json(
        {
          error: "A model with this slug already exists. Choose a different slug or clear the field to auto-generate one.",
          field: "slug" as const,
          code: "DUPLICATE_SLUG" as const,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad request", code: "UNKNOWN" as const },
      { status: 400 }
    );
  }
}
