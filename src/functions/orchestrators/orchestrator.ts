import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as processStudent } from "./processStudent";
import { FUNCTION_NAME as processParent } from "./processParent";
import { FUNCTION_NAME as syncUsers, syncUsersResults } from "./syncUsers";
import { FUNCTION_NAME as blackbaudTestAuth } from "../blackbaud/blackbaudTestAuth";

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
    }

    if (tasks.length > 0) {
      const results: syncUsersResults[] = yield context.df.Task.all(tasks);

      for (const result of results) {
        logger.forceLog(
          Severity.Info,
          `\nSync Results:\n-------------\nRole: ${result.role}\nSynced: ${result.synced}/${
            result.total
          } (${Number((result.synced / result.total) * 100).toFixed(0)}%)\nErrors:\n\t${
            result.errors.join("\n\t") || "None"
          }\nWarnings:\n\t${result.warnings.join("\n\t") || "None"}`
        );
      }
    }

    logger.forceLog(Severity.Info, "Sync job completed successfully!");
  } catch (err) {
    logger.forceLog(Severity.Error, "Orchestration Error:", err);
  }
}

df.app.orchestration(FUNCTION_NAME, syncOrchestrationHandler);
