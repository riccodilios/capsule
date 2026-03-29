import { AuthConfig } from "convex/server";

/**
 * Clerk → Convex: `domain` must equal JWT payload **`iss`**, and `applicationID`
 * must equal JWT **`aud`** (both checked by Convex).
 *
 * Set `CLERK_JWT_ISSUER_DOMAIN` in the Convex dashboard (Settings → Environment
 * Variables) to your Clerk **Frontend API URL** — same app as
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Then run `npx convex dev` / `deploy`.
 *
 * In Clerk you must either:
 * - Enable the **Convex** integration: https://dashboard.clerk.com/apps/setup/convex
 * - Or add a JWT template **named exactly `convex`** (the name `getToken({ template: "convex" })` uses).
 *
 * Decode a token at https://jwt.io — if `iss` ≠ `domain` or `aud` ≠ `convex`, you’ll
 * get “No auth provider found matching the given token”.
 *
 * @see https://docs.convex.dev/auth/clerk
 * @see https://docs.convex.dev/auth/debug
 */
const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://polite-bass-13.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
