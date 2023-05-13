import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

import environment from "../../environment";

export const FUNCTION_NAME = "googleFindGroup";

/**
 * Finds a Google Group using the email of the group
 * @param groupEmail The email of the Google Group to find
 * @param context The invocation context for the function
 * @returns The {@link adminDirectoryV1.Schema$Group} group if found, otherwise undefined
 */
export async function googleFindGroup(
  groupEmail: string,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$Group> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const groupList = await google.listGroups({
      domain: environment.google.domain,
      maxResults: 2,
      query: `email='${groupEmail}'`
    });

    if (!groupList.groups) {
      return undefined;
    } else if (groupList.groups.length > 1) {
      logger.log(Severity.Warning, `Multiple Google Groups found with email ${groupEmail}`);

      return undefined;
    }

    return groupList.groups[0];
  } catch (err) {
    logger.log(Severity.Error, err);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleFindGroup
});
