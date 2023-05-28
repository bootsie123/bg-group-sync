/* eslint-disable @typescript-eslint/no-explicit-any */
import * as df from "durable-functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as blackbaudGetUser } from "../blackbaud/blackbaudGetUser";
import { FUNCTION_NAME as googleFindGroup } from "../google/googleFindGroup";
import { FUNCTION_NAME as googleCreateGroup } from "../google/googleCreateGroup";
import { FUNCTION_NAME as googleAddMemberToGroup } from "../google/googleAddMemberToGroup";

import { genGroupEmail } from "../../utils";

import environment from "../../environment";

export const FUNCTION_NAME = "processParent";

/**
 * Processes the syncing operations required for a singular parent
 * @param context The OrchestrationContext passed to the handler
 * @returns True if the parent was processed successfully, false if otherwise
 */
export function* processParentHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "ProcessParent");

  try {
    const parent: any = context.df.getInput();

    if (!parent.email) {
      return logger.log(
        Severity.Warning,
        `No email found for parent ${parent.first_name} ${parent.last_name}. Skipping Google Groups sync...`
      );
    }

    const gradYears = new Set<string>();

    for (const relationship of parent.relationships) {
      if (relationship.list_as_parent) {
        const user = yield context.df.callActivity(blackbaudGetUser, relationship.user_two_id);

        const roles = user.roles.filter(
          role => role.name === environment.blackbaud.sync.studentRole
        );

        if (roles.length > 0) {
          gradYears.add(user.student_info.grad_year);
        }
      }
    }

    for (const gradYear of gradYears) {
      const parentGroupName = genGroupEmail(
        environment.google.parentGroupEmailPrefix,
        environment.google.domain,
        gradYear
      );

      let group: adminDirectoryV1.Schema$Group = yield context.df.callActivity(
        googleFindGroup,
        parentGroupName
      );

      if (!group) {
        logger.log(
          Severity.Warning,
          `Missing Google Group with name ${parentGroupName}. Creating it now...`
        );

        group = yield context.df.callActivity(googleCreateGroup, {
          groupOptions: {
            email: parentGroupName,
            name: environment.google.parentGroupName + " " + gradYear,
            description: "Parents of the Class of " + gradYear
          },
          permissionOptions: environment.google.parentGroupPermissions
        });

        logger.log(Severity.Info, `Created new Google Group with name ${parentGroupName}`);
      }

      const member = yield context.df.callActivity(googleAddMemberToGroup, {
        groupId: group.id,
        email: parent.email
      });

      if (member) {
        logger.log(Severity.Info, `Added ${parent.email} to Google Group ${parentGroupName}`);
      } else {
        logger.log(
          Severity.Info,
          `Parent ${parent.email} already in Google Group ${parentGroupName}`
        );
      }
    }

    return true;
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);

    return false;
  }
}

df.app.orchestration(FUNCTION_NAME, processParentHandler);
