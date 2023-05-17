import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

import environment from "../../environment";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

export const FUNCTION_NAME = "googleFindUser";

/**
 * Finds a user under the Google domain using their full name
 * @param query The query string to use to find the user
 * @param context The invocation context for the function
 * @returns The {@link adminDirectoryV1.Schema$User} user if found, otherwise undefined
 */
export async function googleFindUser(
  query: string,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$User> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const userList = await google.listUsers({
      domain: environment.google.domain,
      maxResults: 2,
      query
    });

    if (!userList.users) {
      return undefined;
    } else if (userList.users.length > 1) {
      logger.log(Severity.Warning, `Multiple Google accounts found with query ${query}`);

      return undefined;
    }

    return userList.users[0];
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", query);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleFindUser
});
