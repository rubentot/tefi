import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "signicat",
      name: "Signicat (BankID)",
      type: "oauth",
      wellKnown: "https://tefi.sandbox.signicat.com/auth/open/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile" } },
      clientId: process.env.BANKID_CLIENT_ID,
      clientSecret: process.env.BANKID_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || `${profile.given_name} ${profile.family_name}`,
          email: profile.email,
          role: "bidder",
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.role = user.role;
      if (account) {
        const state = account.providerAccountId?.split("_")[1];
        if (state) token.role = state;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Default: Allows relative/same-origin URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Removed pages.signIn
};