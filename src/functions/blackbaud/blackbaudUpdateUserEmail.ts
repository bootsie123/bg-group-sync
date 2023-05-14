import * as df from "durable-functions";

import { ENTITY_ID as authEntity } from "./blackbaudAuthEntity";
import { BlackbaudAPI } from "../../lib/Blackbaud";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "blackbaudUpdateUserEmail";

/**
 * Outlines the parameters needed for {@link blackbaudUpdateUserEmail}
 */
export interface BlackbaudUpdateUserEmailParams {
  /** The ID of the Blackbaud user to update */
  userId: number;
  /** The new email address for the user */
  email: string;
}

/**
 * Updates the email of a Blackbaud user using their associated user ID and new email address
 * @param params A {@link BlackbaudUpdateUserEmailParams} object containing the user ID to update
 * @param context The invocation context for the function
 */
export async function blackbaudUpdateUserEmail(
  params: BlackbaudUpdateUserEmailParams,
  context: InvocationContext
) {
  const logger = new Logger(context, "Blackbaud");

  const client = df.getClient(context);

  const blackbaud = new BlackbaudAPI(client, authEntity, { loggingStream: context });

  try {
    await blackbaud.init();

    await blackbaud.updateUserEmail(params.userId, params.email);
  } catch (err) {
    logger.log(Severity.Error, err);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: blackbaudUpdateUserEmail
});
