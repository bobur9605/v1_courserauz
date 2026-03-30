import vm from "node:vm";

export function runStudentCode(code: string): {
  ok: boolean;
  stdout: string;
  error?: string;
} {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(" "));
      },
    },
  };

  try {
    const context = vm.createContext(sandbox);
    const script = new vm.Script(code);
    script.runInContext(context, { timeout: 2000 });
    return { ok: true, stdout: logs.join("\n").trim() };
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      stdout: logs.join("\n").trim(),
      error: err,
    };
  }
}

export function normalizeOutput(s: string) {
  return s.replace(/\r\n/g, "\n").trim();
}
