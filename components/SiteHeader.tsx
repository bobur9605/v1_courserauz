import { getSession } from "@/lib/auth";
import { ResponsiveSiteHeader } from "@/components/ResponsiveSiteHeader";

export async function SiteHeader() {
  const session = await getSession();
  return <ResponsiveSiteHeader session={session} />;
}
