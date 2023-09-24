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
 * Outlines the object returned by {@link syncUsersHandler}
 */
export interface syncUsersResults {
  /** The Blackbaud role used to retrieve the users to sync */
  role: string;
  /** The total number of users found */
  total?: number;
  /** The total number of users successfully synced */
  synced?: number;
  /** An array of error encountered */
  errors?: string[];
  /** An array of warnings encountered */
  warnings?: string[];
}

/**
 * Outlines the object returned by {@link processParent} and {@link processStudent}
 */
interface ProcessResults {
  /** The result of the operation. Typically "success", "warn", "error" */
  status: string;
  /** An optional message describing the status of the operation */
  message?: string;
}

/**
 * Handles the syncing operations from Blackbaud to Google
 *
 * Requires that a {@link syncUsersHandlerParams} object be passed in as {@link df.OrchestrationContext} input
 * @param context The OrchestrationContext passed to the handler
 * @returns A {@link syncUsersResults} object which contains the results of the sync operation
 */
export function* syncUsersHandler(
  context: df.OrchestrationContext
): Generator<df.Task, syncUsersResults, ProcessResults[]> {
  const logger = new Logger(context, "SyncUsers");

  const params: syncUsersHandlerParams = context.df.getInput();

  const roleName = params.blackbaudRole;

  try {
    const users: any[] = yield context.df.callActivity(blackbaudGetUsers, params.blackbaudRole);

    if (users.length < 1) {
      logger.log(Severity.Warning, `No ${roleName}s found. Skipping sync to Google Groups`);

      return {
        role: roleName,
        warnings: [`No ${roleName}s found`]
      };
    }

    logger.log(Severity.Info, `Found ${users.length} ${roleName}s in Blackbaud`);

    const tasks: df.Task[] = [];

    for (const user of users) {
      tasks.push(context.df.callSubOrchestrator(params.processor, user));
    }

    logger.log(Severity.Info, `Syncing ${tasks.length} ${roleName}s with Google Groups...`);

    let results: ProcessResults[] = [];

    if (tasks.length > 0) {
      results = yield context.df.Task.all(tasks);
    }

    let succeeded = 0;

    const errors = [];
    const warnings = [];

    for (const result of results) {
      switch (result.status) {
        case "success":
          succeeded++;
          break;
        case "warn":
          warnings.push(result.message);
          break;
        case "error":
          errors.push(result.message);
          break;
      }
    }

    logger.forceLog(
      Severity.Info,
      `Successfully synced ${succeeded}/${tasks.length} ${roleName}s to Google Groups`
    );

    return {
      role: roleName,
      total: tasks.length,
      synced: succeeded,
      errors,
      warnings
    };
  } catch (err) {
    logger.forceLog(Severity.Error, "Orchestration Error:", err);

    return {
      role: roleName,
      errors: [err?.message || err?.toString() || err]
    };
  }
}

df.app.orchestration(FUNCTION_NAME, syncUsersHandler);
