import * as df from "durable-functions";

import { Logger, Severity } from "../../lib/Logger";

import { FUNCTION_NAME as blackbaudGetUsers } from "../blackbaud/blackbaudGetUsers";
import { FUNCTION_NAME as processStudent } from "./processStudent";

import environment from "../../environment";

export const FUNCTION_NAME = "syncStudents";

/**
 * Handles the syncing operations of all found students
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* syncStudentsHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, "SyncStudents");

  logger.log(Severity.Info, "Starting student sync job...");

  try {
    const students = yield context.df.callActivity(
      blackbaudGetUsers,
      environment.blackbaud.sync.studentRole
    );

    if (students.length < 1) {
      return logger.log("warning", "No students found. Skipping sync to Google Groups");
    }

    const tasks = [];

    tasks.push(context.df.callSubOrchestrator(processStudent, students[0]));

    /*
    for (const student of students) {
      tasks.push(context.df.callActivity(blackbaudProcessStudents, student));
    }
    */

    if (tasks.length > 0) {
      logger.log(Severity.Info, `Processing ${tasks.length} tasks...`);

      yield context.df.Task.all(tasks);
    } else {
      logger.log(Severity.Info, "No tasks found...");
    }
  } catch (err) {
    logger.log(Severity.Error, "Orchestration Error:", err);
  }

  logger.log("info", "No tasks left to do. Sync completed successfully!");
}

df.app.orchestration(FUNCTION_NAME, syncStudentsHandler);
