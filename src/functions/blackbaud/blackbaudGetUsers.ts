import * as df from "durable-functions";

import { ENTITY_ID as authEntity } from "./blackbaudAuthEntity";
import { BlackbaudAPI } from "../../lib/Blackbaud";
import { Logger, Severity } from "../../lib/Logger";
import { InvocationContext } from "@azure/functions";

export const FUNCTION_NAME = "blackbaudGetUsers";

/**
 * Retrieves a list of all users within Blackbaud which have the specified role
 * @param userRoleName The name of the role which users must match
 * @param context The invocation context for the function
 * @returns A list of users with the specified role
 */
export async function blackbaudGetUsers(
  userRoleName: string,
  context: InvocationContext
): Promise<unknown[]> {
  const logger = new Logger(context, "Blackbaud");

  const client = df.getClient(context);

  const blackbaud = new BlackbaudAPI(client, authEntity, { loggingStream: context });

  let users = [];

  logger.log(Severity.Info, `Fetching users of role ${userRoleName}...`);

  try {
    await blackbaud.init();

    const roles = (await blackbaud.getRoles()).value;

    const userRole = roles.find(role => role.name == userRoleName);

    if (!userRole) {
      logger.log(Severity.Error, `Unable to find role of name ${userRoleName}`);

      return [];
    }

    let marker = 0;

    do {
      const data = await blackbaud.getUsersByRoles([userRole.base_role_id], marker, true);

      const nextUrl = new URL(data.next_link, "https://example.com");

      marker = parseInt(nextUrl.searchParams.get("marker"));

      users = users.concat(data.value);
    } while (marker);
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", userRoleName);

    throw err;
  }

  logger.log(Severity.Info, `${users.length} users found`);

  return users;
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: blackbaudGetUsers
});
