import * as df from "durable-functions";

import { ENTITY_ID as authEntity } from "./blackbaudAuthEntity";
import { BlackbaudAPI } from "../../lib/Blackbaud";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "blackbaudGetMe";

/**
 * Retrieves information about the specified user
 * @param userId The ID of the user to retrieve
 * @param context The invocation context for the function
 * @returns The information on the user
 */
export async function blackbaudGetMe(userId: number, context: InvocationContext) {
  const logger = new Logger(context, "Blackbaud");

  const client = df.getClient(context);

  const blackbaud = new BlackbaudAPI(client, authEntity, { loggingStream: context });

  try {
    await blackbaud.init();

    const user = await blackbaud.getMe();

    return user;
  } catch (err) {
    logger.log(Severity.Error, err);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: blackbaudGetMe
});
