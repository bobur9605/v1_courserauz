import { getSession } from "@/lib/auth";
import { getOwnUserProfile, profileUpdateSchema, updateOwnUserProfile } from "@/lib/userProfile";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const user = await getOwnUserProfile(session);
    if (!user) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(user);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body: ReturnType<typeof profileUpdateSchema.parse>;
  try {
    body = profileUpdateSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const ok = await updateOwnUserProfile(session, body);
    return ok
      ? Response.json({ ok: true })
      : Response.json({ error: "bad_request" }, { status: 400 });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
}
