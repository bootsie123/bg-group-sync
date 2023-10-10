/* eslint-disable @typescript-eslint/no-explicit-any */
import * as df from "durable-functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as googleFindUser } from "../google/googleFindUser";
import { FUNCTION_NAME as googleFindUsers } from "../google/googleFindUsers";
import { FUNCTION_NAME as blackbaudUpdateUserEmail } from "../blackbaud/blackbaudUpdateUserEmail";
import { FUNCTION_NAME as googleFindGroup } from "../google/googleFindGroup";
import { FUNCTION_NAME as googleAddMemberToGroup } from "../google/googleAddMemberToGroup";
import { FUNCTION_NAME as googleCreateGroup } from "../google/googleCreateGroup";
import { FUNCTION_NAME as googleCreateUser } from "../google/googleCreateUser";
import { FUNCTION_NAME as googleListOrgUnits } from "../google/googleListOrgUnits";

import { genGroupEmail, genAccountEmail } from "../../utils";

import environment from "../../environment";

export const FUNCTION_NAME = "processStudent";

/**
 * Outlines the object returned by {@link processStudentHandler}
 */
export interface ProcessStudentResults {
  /** The result of the operation. Typically "success", "warn", "error" */
  status: string;
  /** An optional message describing the status of the operation */
  message?: string;
}

/**
 * Processes the syncing operations required for a singular student
 * @param context The OrchestrationContext passed to the handler
 * @returns The status of the operation in a {@link ProcessParentResults} object
 */
export function* processStudentHandler(
  context: df.OrchestrationContext
): Generator<
  df.Task,
  ProcessStudentResults,
  adminDirectoryV1.Schema$User &
    adminDirectoryV1.Schema$Group &
    adminDirectoryV1.Schema$User[] &
    adminDirectoryV1.Schema$OrgUnit[]
> {
  const logger = new Logger(context, "ProcessStudent");

  try {
    const student: any = context.df.getInput();

    const studentFullName = student.first_name + " " + student.last_name;
    const gradYear = student.student_info.grad_year;
    const gradYearNum = parseInt(gradYear, 10);
    const classOf = environment.google.studentGroupName + " " + gradYear;

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
      environment.sync.createAccounts &&
      (!user || !user?.primaryEmail.toLowerCase().includes(gradYear.substring(gradYear.length - 2)))
    ) {
      if (Number.isNaN(gradYearNum)) {
        return {
          status: "error",
          message: `Unable to parse graduation year ${gradYear} for user ${studentFullName}`
        };
      } else if (gradYearNum > environment.google.accountCreationMinGradYear) {
        logger.forceLog(
          Severity.Info,
          `User ${studentFullName} does not meet the minimum graduation year requirement for a Google account. Skipping Google sync...`
        );

        return {
          status: "success"
        };
      }

      logger.log(
        Severity.Info,
        `No Google account found for user ${studentFullName}. Creating new account...`
      );

      let newEmail = genAccountEmail(
        student.first_name,
        student.last_name,
        environment.google.domain,
        gradYear
      );

      const foundUsers: adminDirectoryV1.Schema$User[] = yield context.df.callActivity(
        googleFindUsers,
        `email=${newEmail}`
      );

      if (foundUsers) {
        newEmail = genAccountEmail(
          student.first_name,
          student.last_name,
          environment.google.domain,
          gradYear,
          "." + foundUsers.length
        );
      }

      const orgUnits: adminDirectoryV1.Schema$OrgUnit[] = yield context.df.callActivity(
        googleListOrgUnits,
        environment.google.accountCreationOrgUnitPath
      );

      let orgUnit = orgUnits.find(unit => unit.name === classOf);

      if (!orgUnit) {
        orgUnit = {
          orgUnitPath: environment.google.accountCreationOrgUnitPath
        };

        logger.log(
          Severity.Warning,
          `Unable to find organizational unit for user creation of ${studentFullName} (${newEmail} - ${classOf}). Using default organizational unit path...`
        );
      }

      const userProfile: adminDirectoryV1.Schema$User = {
        primaryEmail: newEmail,
        password: environment.google.accountCreationPassword,
        changePasswordAtNextLogin: true,
        name: {
          givenName: student.first_name,
          familyName: student.last_name
        },
        orgUnitPath: orgUnit.orgUnitPath
      };

      user = yield context.df.callActivity(googleCreateUser, userProfile);

      logger.log(
        Severity.Info,
        `Successfully created new Google account for user ${studentFullName} (${newEmail})!`
      );
    }

    if (
      environment.sync.syncStudentEmails &&
      student.email.toLowerCase() !== user.primaryEmail.toLowerCase()
    ) {
      try {
        yield context.df.callActivity(blackbaudUpdateUserEmail, {
          userId: student.id,
          email: user.primaryEmail
        });

        logger.log(Severity.Info, `Updated Blackbaud email for user ${studentFullName}`);
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
          name: classOf,
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
      logger.forceLog(Severity.Info, `Added ${student.email} to Google Group ${studentGroupName}`);
    } else {
      logger.forceLog(
        Severity.Info,
        `Student ${student.email} already in Google Group ${studentGroupName}`
      );
    }

    return { status: "success" };
  } catch (err) {
    logger.forceLog(Severity.Error, "Orchestration Error:", err);

    return { status: "error", message: err };
  }
}

df.app.orchestration(FUNCTION_NAME, processStudentHandler);
