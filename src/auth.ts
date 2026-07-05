import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { parseAllowlist, isEditor } from "@/lib/editors";

const allowlist = parseAllowlist(process.env.EDITORS_ALLOWLIST);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      return isEditor(user.email, allowlist);
    },
  },
});
