import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as processStudent } from "./processStudent";
import { FUNCTION_NAME as processParent } from "./processParent";
import { FUNCTION_NAME as syncUsers } from "./syncUsers";
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

  try {
    yield context.df.callActivity(blackbaudTestAuth);

    const tasks = [];

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
      yield context.df.Task.all(tasks);
    }
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);
  }

  logger.log(Severity.Info, "No tasks left to do. Sync completed successfully!");
}

df.app.orchestration(FUNCTION_NAME, syncOrchestrationHandler);
