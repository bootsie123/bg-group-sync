import * as df from "durable-functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";
import { InvocationContext } from "@azure/functions";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

export const FUNCTION_NAME = "googleCreateUser";

/**
 * Creates a new Google account with the specified options
 * @param user A {@link adminDirectoryV1.Schema$User} object containing the user to create
 * @param context The invocation context for the function
 * @returns The newly created {@link adminDirectoryV1.Schema$User} user
 */
export async function googleCreateUser(
  user: adminDirectoryV1.Schema$User,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$User> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const newUser = await google.createUser({
      requestBody: user
    });

    return newUser;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", user);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleCreateUser
});
