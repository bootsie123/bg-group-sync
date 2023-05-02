import { app } from "@azure/functions";
import * as df from "durable-functions";

import { utils } from "../lib/blackbaud.mjs";
import logger from "../lib/logger.mjs";

app.http("blackbaudAuthCallback", {
  route: "auth/callback",
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    const log = logger.createFromContext(context, "Blackbaud");

    const error = req.query.get("error");
    const errorMessage = req.query.get("error_message");
    const errorDescription = req.query.get("error_description");

    const code = req.query.get("code");

    if (error) {
      const errorText = `Error from Blackbaud OAuth2 forwarded to callback\n\nError: ${error}\n
                         Message: ${errorMessage}\nDescription: ${errorDescription}`;

      log("error", errorText);

      return {
        status: 400,
        body: errorText
      };
    }

    if (!code) {
      const errorText =
        "Error from Blackbaud OAuth2 callback\n\nError: No OAuth2 code found";

      log("error", errorText);

      return {
        status: 400,
        body: errorText
      };
    }

    const url = new URL(req.url);

    try {
      const data = await utils.getAccessTokenFromCode(
        code,
        url.origin + url.pathname
      );

      const client = df.getClient(context);

      client.signalEntity(
        new df.EntityId("blackbaudAuthEntity", "ticket"),
        "set",
        data.token
      );

      log("info", "OAuth2 account linked successfully!");

      return {
        body: "Authentication successful!"
      };
    } catch (err) {
      console.log(err);

      const errorText = `Error confirming Blackbaud OAuth2 callback code\n\nError: ${err.message}`;

      log("error", errorText);

      return {
        status: 400,
        body: errorText
      };
    }
  }
});
