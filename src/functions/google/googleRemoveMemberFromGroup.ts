import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

export const FUNCTION_NAME = "googleRemoveMemberFromGroup";

/**
 * Outlines the parameters needed for {@link googleRemoveMemberFromGroup}
 */
export interface GoogleRemoveMemberFromGroupParams {
  /** The ID of the Google Group */
  groupId: string;
  /** The email of the user to remove */
  email: string;
}

/**
 * Removes a member from the specified Google Group
 * @param params A {@link GoogleRemoveMemberFromGroupParams} object containing the group ID and email of the member to remove
 * @param context The invocation context for the function
 * @returns True if successful
 */
export async function googleRemoveMemberFromGroup(
  params: GoogleRemoveMemberFromGroupParams,
  context: InvocationContext
): Promise<boolean> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    await google.removeMemberFromGroup({
      groupKey: params.groupId,
      memberKey: params.email
    });

    return true;
  } catch (err) {
    if (err?.includes("Resource Not Found: memberKey")) return true;
    if (err?.includes("Missing required field: memberKey")) return true;

    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleRemoveMemberFromGroup
});
