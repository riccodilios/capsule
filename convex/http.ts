import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/push/action",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const token = typeof body?.token === "string" ? body.token : "";
    const action = typeof body?.action === "string" ? body.action : "";
    if (!token || !action) {
      return new Response("Bad Request", { status: 400 });
    }
    try {
      await ctx.runMutation(internal.push.applyActionToken, { token, action });
      return new Response("OK", { status: 200 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }),
});

export default http;

