import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "signicat",
      name: "Signicat (BankID)",
      type: "oauth",
      wellKnown: "https://api.signicat.com/auth/open/.well-known/openid-configuration",
      authorization: { params: { scope: "openid profile email" } },
      clientId: process.env.SIGNICAT_CLIENT_ID,
      clientSecret: process.env.SIGNICAT_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || `${profile.given_name} ${profile.family_name}`,
          email: profile.email,
          role: "bidder", // ✅ Always bidder for Signicat
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "bidder";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) || "bidder";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
