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
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url;
      // Default to home or dashboard based on role (extract from state if available)
      const state = new URL(url).searchParams.get("state");
      const role = state ? state.split("_")[1] : "bidder";
      return role === "bidder" ? `${baseUrl}/bid-form` : `${baseUrl}/dashboard`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};