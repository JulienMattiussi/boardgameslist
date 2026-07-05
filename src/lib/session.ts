import { auth } from "@/auth";
import { parseAllowlist, isEditor } from "@/lib/editors";

export async function isEditorRequest(): Promise<boolean> {
  const session = await auth();
  const allowlist = parseAllowlist(process.env.EDITORS_ALLOWLIST);
  return isEditor(session?.user?.email, allowlist);
}
