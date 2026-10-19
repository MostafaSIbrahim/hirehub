import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "SEEKER",
        input: false, // ← security: the sign-up request can NOT set this
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },
    databaseHooks: {
    session: {
      create: {
        // Runs every time Better Auth is about to create a session (i.e. every login).
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true },
          });
          if (user?.status === "SUSPENDED") {
            throw new APIError("FORBIDDEN", { message: "Your account has been suspended." });
          }
          return { data: session };
        },
      },
    },
  },

  // Lets Server Actions set auth cookies. Keep it LAST in the list.
  plugins: [nextCookies()],
});