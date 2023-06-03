import * as df from "durable-functions";
import {
  admin_directory_v1 as adminDirectoryV1,
  groupssettings_v1 as groupsSettingsV1
} from "googleapis";
import { InvocationContext } from "@azure/functions";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

export const FUNCTION_NAME = "googleCreateGroup";

/**
 * Outlines the parameters needed for {@link googleCreateGroup}
 */
export interface GoogleCreateGroupParams {
  /** The group to create */
  groupOptions: adminDirectoryV1.Schema$Group;
  /** The permissions to assign to the group after creation */
  permissionOptions: groupsSettingsV1.Schema$Groups;
}

/**
 * Creates a Google Group with the specified options and permissions
 * @param params A {@link GoogleCreateGroupParams} object containing the group and permission options
 * @param context The invocation context for the function
 * @returns The newly created {@link adminDirectoryV1.Schema$Group} group
 */
export async function googleCreateGroup(
  params: GoogleCreateGroupParams,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$Group> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const group = await google.createGroup({
      requestBody: params.groupOptions
    });

    const updateParams = {
      groupUniqueId: group.email,
      requestBody: params.permissionOptions
    };

    try {
      await google.updateGroupSettings(updateParams);
    } catch (err) {
      logger.log(
        Severity.Warning,
        `Unable to update group settings of group ${group.email}`,
        "\nInput Parameters:",
        updateParams
      );
    }

    return group;
  } catch (err) {
    if (err.includes("Entity already exists")) {
      const groupKey = params.groupOptions.email || params.groupOptions.id;

      try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const existingGroup = await google.getGroup({ groupKey });

        return existingGroup;
      } catch (err) {
        logger.log(
          Severity.Error,
          `Error fetching existing group ${groupKey} during group creation:`,
          err
        );
      }
    }

    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleCreateGroup
});
