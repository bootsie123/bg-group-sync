import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as blackbaudGetUsers } from "../blackbaud/blackbaudGetUsers";

export const FUNCTION_NAME = "syncUsers";

/**
 * Outlines the parameters needed for {@link syncUsersHandler}
 */
export interface syncUsersHandlerParams {
  /** The Blackbaud role used to retrieve the users to sync */
  blackbaudRole: string;
  /** The name of the Azure Orchestrator being used to process each found user */
  processor: string;
}

/**
 * Handles the syncing operations from Blackbaud to Google
 *
 * Requires that a {@link syncUsersHandlerParams} object be passed in as {@link df.OrchestrationContext} input
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncUsersHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "SyncUsers");

  const params: syncUsersHandlerParams = context.df.getInput();

  const roleName = params.blackbaudRole.toLowerCase();

  logger.log(Severity.Info, `Starting ${roleName} sync job...`);

  try {
    const users = yield context.df.callActivity(blackbaudGetUsers, params.blackbaudRole);

    if (users.length < 1) {
      return logger.log("warning", `No ${roleName}s found. Skipping sync to Google Groups`);
    }

    logger.log(Severity.Info, `Found ${users.length} ${roleName}s in Blackbaud`);

    const tasks = [];

    for (const user of users) {
      tasks.push(context.df.callSubOrchestrator(params.processor, user));
    }

    if (tasks.length > 0) {
      logger.log(Severity.Info, `Syncing ${tasks.length} ${roleName}s with Google Groups...`);

      const results = yield context.df.Task.all(tasks);

      const tasksSucceeded = results.reduce((prev, curr) => (curr ? ++prev : prev), 0);

      logger.log(
        Severity.Info,
        `Successfully synced ${tasksSucceeded}/${tasks.length} ${roleName}s to Google Groups`
      );
    } else {
      logger.log(Severity.Info, "No tasks found...");
    }
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);
  }

  logger.log(Severity.Info, "No tasks left to do. Sync completed successfully!");
}

df.app.orchestration(FUNCTION_NAME, syncUsersHandler);
