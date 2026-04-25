/** Parsed failure for the Add model form ? used by the error panel. */

export type AddModelFieldIssue = {
  fieldLabel: string;
  message: string;
  hint?: string;
};

export type AddModelFailure = {
  title: string;
  intro: string;
  issues: AddModelFieldIssue[];
  technical?: string;
};

const FIELD_PATH_LABELS: Record<string, string> = {
  displayName: "Display name",
  slug: "Slug",
  source: "Source",
  hfModelId: "Hugging Face model id",
  localModelPath: "Local model folder",
  paramsJson: "Extra parameters (paramsJson)",
  form: "Form",
  "": "Request",
};

function labelForPath(path: string): string {
  if (!path || path === "form") {
    return "Form";
  }
  const key = path.split(".")[0] ?? path;
  return FIELD_PATH_LABELS[key] ?? key;
}

type ApiErrorJson = {
  error?: string;
  issues?: { path: string; message: string }[];
  field?: string;
  code?: string;
};

export function buildLoadTargetFailure(): AddModelFailure {
  return {
    title: "A model load target is required",
    intro:
      "Benchmark runs need a way to load weights. Add at least one of the following: a Hugging Face id, a local folder on the worker, or set Source in org/model form.",
    issues: [
      {
        fieldLabel: "Hugging Face id, local path, or Source",
        message: "None of these currently provide a load target together.",
        hint: "Use Hugging Face model id (e.g. org/model), Local model folder, or set Source to something like org/model (two segments separated by a slash).",
      },
    ],
  };
}

export function parseAddModelApiFailure(status: number, body: unknown): AddModelFailure {
  const j = (body && typeof body === "object" ? body : {}) as ApiErrorJson;
  const raw = typeof j.error === "string" ? j.error : "Request failed";
  const code = j.code;

  if (status === 409 || code === "DUPLICATE_SLUG" || (raw && /duplicate/i.test(raw))) {
    return {
      title: "This slug is already taken",
      intro:
        "Model slugs must be unique. Another model is already using this slug (or the slug we would generate from your display name).",
      issues: [
        {
          fieldLabel: "Slug",
          message: "Conflicts with an existing model.",
          hint: "Change the Slug, or clear it to auto-generate from the display name (you may need to change the display name so the generated slug is unique).",
        },
      ],
      technical: raw,
    };
  }

  if (j.issues && j.issues.length > 0) {
    return {
      title: "Some fields need attention",
      intro:
        "The server could not save the model because one or more values did not pass validation. Fix the items below and submit again.",
      issues: j.issues.map((it) => ({
        fieldLabel: labelForPath(it.path),
        message: it.message,
        hint: zodMessageHint(it.message, it.path),
      })),
      technical: raw,
    };
  }

  if (status >= 500) {
    return {
      title: "Server error",
      intro:
        "The server had a problem while saving. This is often temporary. If it keeps happening, check that the database is running and reachable.",
      issues: [
        {
          fieldLabel: "Server",
          message: raw,
        },
      ],
      technical: raw,
    };
  }

  if (status === 0) {
    return {
      title: "Could not reach the app",
      intro: "The browser could not complete the request. Check that the dev server is running and you are online.",
      issues: [
        {
          fieldLabel: "Connection",
          message: raw,
        },
      ],
      technical: raw,
    };
  }

  return {
    title: "We could not add this model",
    intro: "The server returned an error. See the details below. Open technical details for the exact response.",
    issues: [
      {
        fieldLabel: "Response",
        message: raw,
        hint: "If you see a database or configuration message, check DATABASE_URL and server logs.",
      },
    ],
    technical: raw,
  };
}

function zodMessageHint(message: string, path: string): string | undefined {
  const m = message.toLowerCase();
  if (m.includes("required") && path.includes("displayName")) {
    return "Enter a non-empty display name (used in the UI).";
  }
  if (m.includes("regex") || m.includes("slug")) {
    return "Slugs: lowercase, numbers, hyphens only, starting with a letter or number.";
  }
  if (m.includes("200") && path.includes("displayName")) {
    return "Display name: at most 200 characters.";
  }
  if (m.includes("500") || m.includes("2000")) {
    return "Shorten the value to fit the maximum length for this field.";
  }
  return undefined;
}
