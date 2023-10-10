import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as processStudent } from "./processStudent";
import { FUNCTION_NAME as processParent } from "./processParent";
import { FUNCTION_NAME as syncUsers, syncUsersResults } from "./syncUsers";
import { FUNCTION_NAME as blackbaudTestAuth } from "../blackbaud/blackbaudTestAuth";
import { FUNCTION_NAME as smtpSendJobReport } from "../smtp";

import environment from "../../environment";

export const FUNCTION_NAME = "syncOrchestrator";

/**
 * Responsible for initiating the sync tasks
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncOrchestrationHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "Orchestrator");

  logger.log(Severity.Info, "Starting sync job...");

  try {
    yield context.df.callActivity(blackbaudTestAuth);

    const tasks: df.Task[] = [];

    if (environment.sync.syncStudents) {
      tasks.push(
        context.df.callSubOrchestrator(syncUsers, {
          blackbaudRole: environment.blackbaud.sync.studentRole,
          processor: processStudent
        })
      );
    }

    if (environment.sync.syncParents) {
      tasks.push(
        context.df.callSubOrchestrator(syncUsers, {
          blackbaudRole: environment.blackbaud.sync.parentRole,
          processor: processParent
        })
      );

      const pastParentRoles = environment.blackbaud.sync.pastParentRoles.split(",").map(role => role.trim());

      for (const role of pastParentRoles) {
        tasks.push(
          context.df.callSubOrchestrator(syncUsers, {
            blackbaudRole: role,
            processor: processParent
          })
        );
      }
    }

    if (tasks.length > 0) {
      const results: syncUsersResults[] = yield context.df.Task.all(tasks);

      let hasErrors = false;
      let hasWarnings = false;

      for (const result of results) {
        if (result?.errors?.length > 0) hasErrors = true;
        if (result?.warnings?.length > 0) hasWarnings = true;

        let logMessage = `\nSync Results:\n-------------\nRole: ${result.role}\n`;

        if (result.synced && result.total) {
          const syncPercentage = Number((result.synced / result.total) * 100).toFixed(0);

          logMessage += `Synced: ${result.synced}/${result.total} (${syncPercentage}%)\n`;
        } else {
          logMessage += "Synced: N/A\n";
        }

        logMessage += `Warnings:\n\t${result.warnings?.join("\n\t") || "None"}\nErrors:\n\t${
          result.errors?.join("\n\t") || "None"
        }`;

        logger.forceLog(Severity.Info, logMessage);
      }

      const reportFrequency = environment.smtp.reportFrequency;

      if (
        environment.smtp.reportsEnabled &&
        ((reportFrequency === "on-error" && hasErrors) ||
          (reportFrequency === "on-warning" && hasWarnings) ||
          reportFrequency === "always")
      ) {
        logger.forceLog(Severity.Info, "Job reports enabled! Sending report...");

        yield context.df.callActivity(smtpSendJobReport, results);

        logger.forceLog(Severity.Info, "Job report email sent!");
      }
    }

    logger.forceLog(Severity.Info, "Sync job completed successfully!");
  } catch (err) {
    logger.forceLog(Severity.Error, "Orchestration Error:", err);
  }
}

df.app.orchestration(FUNCTION_NAME, syncOrchestrationHandler);
