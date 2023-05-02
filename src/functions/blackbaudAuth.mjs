import { app } from "@azure/functions";

import { utils } from "../lib/blackbaud.mjs";

app.http("blackbaudAuth", {
  route: "auth",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req, context) => {
    const uri = utils.getAuthorizationUri(req.url + "/callback");

    return {
      status: 302,
      headers: {
        Location: uri
      }
    };
  }
});
