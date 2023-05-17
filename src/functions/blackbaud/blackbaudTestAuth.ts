import * as df from "durable-functions";

import { ENTITY_ID as authEntity } from "./blackbaudAuthEntity";
import { BlackbaudAPI } from "../../lib/Blackbaud";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "blackbaudTestAuth";

/**
 * Tests authentication with the linked Blackbaud account
 * @param input Function inputs
 * @param context The invocation context for the function
 * @returns True if authentication is successful, otherwise false
 */
export async function blackbaudTestAuth(input, context: InvocationContext) {
  const logger = new Logger(context, "Blackbaud");

  const client = df.getClient(context);

  const blackbaud = new BlackbaudAPI(client, authEntity, { loggingStream: context });

  try {
    await blackbaud.init();

    const roles = await blackbaud.getRoles();

    return roles ? true : false;
  } catch (err) {
    logger.log(Severity.Error, err);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: blackbaudTestAuth
});
