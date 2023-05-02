import * as df from "durable-functions";

import { BlackbaudAPI } from "../lib/blackbaud.mjs";
import logger from "../lib/logger.mjs";

df.app.activity("blackbaudAuthenticate", {
  extraInputs: [df.input.durableClient()],
  handler: async (input, context) => {
    const log = logger.createFromContext(context, "Blackbaud");

    const client = df.getClient(context);
    const entity = new df.EntityId("blackbaudAuthEntity", "ticket");

    const entityRes = await client.readEntityState(entity);

    if (!entityRes.entityState) {
      throw new Error(
        "[Blackbaud] No refresh token found! You must link a Blackbaud account before syncing"
      );
    }

    const blackbaud = new BlackbaudAPI(entityRes.entityState, {
      context,
      entity
    });

    if (blackbaud.isRefreshTokenExpired()) {
      throw new Error(
        "[Blackbaud] Refresh token expired. Must relink OAuth2 account"
      );
    } else {
      log("info", "Account already linked");
    }

    return blackbaud;
  }
});
