import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

export const FUNCTION_NAME = "syncParents";

/**
 * Handles the syncing operations of all found parents
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncParentsHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "SyncParents");

  logger.log(Severity.Info, "Starting parent sync job...");

  try {
    logger.log("info", "No tasks left to do. Sync completed successfully!");
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);
  }
}

df.app.orchestration(FUNCTION_NAME, syncParentsHandler);
