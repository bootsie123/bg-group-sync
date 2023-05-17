/* eslint-disable @typescript-eslint/no-explicit-any */
import * as df from "durable-functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as googleFindUser } from "../google/googleFindUser";
import { FUNCTION_NAME as blackbaudUpdateUserEmail } from "../blackbaud/blackbaudUpdateUserEmail";
import { FUNCTION_NAME as googleFindGroup } from "../google/googleFindGroup";
import { FUNCTION_NAME as googleAddMemberToGroup } from "../google/googleAddMemberToGroup";
import { FUNCTION_NAME as googleCreateGroup } from "../google/googleCreateGroup";

import { genGroupEmail } from "../../utils";

import environment from "../../environment";

export const FUNCTION_NAME = "processStudent";

/**
 * Processes the syncing operations required for a singular student
 * @param context The OrchestrationContext passed to the handler
 * @returns True if the student was processed successfully, false if otherwise
 */
export function* processStudentHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "ProcessStudent");

  try {
    const student: any = context.df.getInput();

    const studentFullName = student.first_name + " " + student.last_name;
    const gradYear = student.student_info.grad_year;

    const queries = [];

    if (student.email) {
      queries.push(`email=${student.email}`);
    }

    queries.push(`name=${studentFullName}`, `name=${student.preferred_name} ${student.last_name}`);

    let user: adminDirectoryV1.Schema$User;

    for (const query of queries) {
      user = yield context.df.callActivity(googleFindUser, query);

      if (user) break;
    }

    if (
      !user ||
      !user?.primaryEmail.toLowerCase().includes(gradYear.substring(gradYear.length - 2))
    ) {
      // Create Google account

      logger.log(
        Severity.Error,
        `No Google account found for user ${studentFullName}. Skipping Google sync...`
      );

      return true;
    }

    if (student.email.toLowerCase() !== user.primaryEmail.toLowerCase()) {
      try {
        yield context.df.callActivity(blackbaudUpdateUserEmail, {
          userId: student.id,
          email: user.primaryEmail
        });

        logger.log(Severity.Info, `Updated Blackbuad email for user ${studentFullName}`);
      } catch (err) {
        logger.log(
          Severity.Warning,
          `Failed to update Blackbaud email for user ${studentFullName}: `,
          err
        );
      }
    }

    const studentGroupName = genGroupEmail(
      environment.google.studentGroupEmailPrefix,
      environment.google.domain,
      gradYear
    );

    let group: adminDirectoryV1.Schema$Group = yield context.df.callActivity(
      googleFindGroup,
      studentGroupName
    );

    if (!group) {
      logger.log(
        Severity.Warning,
        `Missing Google Group with name ${studentGroupName}. Creating it now...`
      );

      group = yield context.df.callActivity(googleCreateGroup, {
        groupOptions: {
          email: studentGroupName,
          name: environment.google.studentGroupName + " " + gradYear,
          description: "Students Class of " + gradYear
        },
        permissionOptions: environment.google.studentGroupPermissions
      });

      logger.log(Severity.Info, `Created new Google Group with name ${studentGroupName}`);
    }

    const member = yield context.df.callActivity(googleAddMemberToGroup, {
      groupId: group.id,
      email: student.email
    });

    if (member) {
      logger.log(Severity.Info, `Added ${student.email} to Google Group ${studentGroupName}`);
    } else {
      logger.log(
        Severity.Info,
        `Student ${student.email} already in Google Group ${studentGroupName}`
      );
    }

    return true;
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);

    return false;
  }
}

df.app.orchestration(FUNCTION_NAME, processStudentHandler);
