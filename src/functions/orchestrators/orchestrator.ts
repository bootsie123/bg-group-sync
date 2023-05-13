import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as syncStudents } from "./syncStudents";
// import { FUNCTION_NAME as parentOrchestrator } from "./parentOrchestrator";

export const FUNCTION_NAME = "syncOrchestrator";

/**
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncOrchestrationHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "Orchestrator");

  logger.log(Severity.Info, "Starting sync job...");

  try {
    const tasks = [];

    tasks.push(context.df.callSubOrchestrator(syncStudents));
    // tasks.push(context.df.callSubOrchestrator(parentOrchestrator));

    yield context.df.Task.all(tasks);
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);
  }

  logger.log("info", "No tasks left to do. Sync completed successfully!");
}

df.app.orchestration(FUNCTION_NAME, syncOrchestrationHandler);
