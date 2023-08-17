import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

import environment from "../../environment";

export const FUNCTION_NAME = "googleFindUsers";

/**
 * Finds multiple users under the Google domain using the given query
 * @param query The query string to use to find users
 * @param context The invocation context for the function
 * @returns A list of {@link adminDirectoryV1.Schema$User} users if found, otherwise undefined
 */
export async function googleFindUsers(
  query: string,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$User[]> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const userList = await google.listUsers({
      domain: environment.google.domain,
      query
    });

    if (!userList.users) {
      return undefined;
    }

    return userList.users;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", query);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleFindUsers
});
