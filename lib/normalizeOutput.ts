export function normalizeOutput(s: string) {
  return s.replace(/\r\n/g, "\n").trim();
}

