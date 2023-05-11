import * as df from "durable-functions";

import { BlackbaudAPI } from "../../lib/Blackbaud.js";

import { Logger } from "../../lib/Logger";
import environment from "../../environment";

export const FUNCTION_NAME = "syncOrchestrator";

/**
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncOrchestrationHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "Orchestrator");

  logger.log("info", "Starting sync job...");

  try {
    // TODO Make blackbaudFetchGroups initialize BlackbaudAPI object directly

    let groups = yield context.df.callActivity("blackbaudFetchGroups", blackbaud);

    if (groups.length < 1) {
      return logger.log("warning", "No groups found. Skipping Google sync");
    }

    const syncMap = environment.sync.map;

    groups = groups.filter(group => syncMap[group.id]); // Move this line into blackbaudFetchGroups

    const tasks = [];

    for (const group of groups) {
      tasks.push(
        context.df.callActivity("googleUpdateGroup", {
          googleGroupId: syncMap[group.id],
          blackbaudGroup: group
        })
      );
    }

    if (tasks.length > 0) {
      logger.log("info", `Processing ${tasks.length} group syncs...`);

      yield context.df.Task.all(tasks);
    } else {
      logger.log("info", "No tasks found...");
    }

    logger.log("info", "No tasks left to do. Sync completed successfully!");
  } catch (err) {
    logger.log("error", "Orchestration Error:", err);
  }
}

df.app.orchestration(FUNCTION_NAME, syncOrchestrationHandler);
