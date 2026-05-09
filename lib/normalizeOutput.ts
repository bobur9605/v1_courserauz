export function normalizeOutput(s: string) {
  return s.replace(/\r\n/g, "\n").trim();
}

/** Trim + remove `<!-- ... -->` so lesson hints in index.html do not break exact match. */
export function normalizeMarkupOutput(s: string) {
  return normalizeOutput(s.replace(/<!--[\s\S]*?-->/g, ""));
}

