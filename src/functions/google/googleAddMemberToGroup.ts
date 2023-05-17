import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

export const FUNCTION_NAME = "googleAddMemberToGroup";

/**
 * Outlines the parameters needed for {@link googleAddMemberToGroup}
 */
export interface GoogleAddMemberToGroupParams {
  /** The ID of the Google Group */
  groupId: string;
  /** The email of the user to add */
  email: string;
}

/**
 * Adds a member to the specified Google Group
 * @param params A {@link GoogleAddMemberToGroupParams} object containing the group ID and email of the member to add
 * @param context The invocation context for the function
 * @returns The newly added {@link adminDirectoryV1.Schema$Member} member
 */
export async function googleAddMemberToGroup(
  params: GoogleAddMemberToGroupParams,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$Member> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const member = await google.addMemberToGroup({
      groupKey: params.groupId,
      requestBody: {
        email: params.email,
        role: "MEMBER"
      }
    });

    return member;
  } catch (err) {
    if (err.includes("Member already exists")) return;
    else if (err.includes("Resource Not Found")) return;

    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleAddMemberToGroup
});
