import { HttpRequest, InvocationContext, Timer, app } from "@azure/functions";
import * as df from "durable-functions";
import * as pug from "pug";

import { FUNCTION_NAME as orchestrator } from "./orchestrators/orchestrator";
import { Logger } from "../lib/Logger";

import environment from "../environment";

export const FUNCTION_NAME = "syncStart";

const INSTANCE_ID = "syncOperation";

const template = pug.compileFile(__dirname + "/../templates/message.pug");

/**
 * Starts the main sync operation as an Azure Function handler
 * @param input The input from the Azure Function
 * @param context The invocation context of the function
 * @returns An HTTP response if the input is of type {@link HttpRequest}
 */
async function startSyncHandler(input: HttpRequest | Timer, context: InvocationContext) {
  const logger = new Logger(context, "SyncStart");

  const client = df.getClient(context);

  const status = await client.getStatus(INSTANCE_ID);

  let message = "Sync job already started";

  if (
    !status ||
    status.runtimeStatus === "Completed" ||
    status.runtimeStatus === "Failed" ||
    status.runtimeStatus === "Terminated"
  ) {
    logger.log("info", "Starting new sync job...");

    await client.startNew(orchestrator, {
      instanceId: INSTANCE_ID
    });

    message = "Starting sync from Blackbaud to Google Groups...";
  }

  return {
    status: 200,
    headers: {
      "content-type": "text/html"
    },
    body: template({
      success: true,
      text: message
    })
  };
}

app.http(FUNCTION_NAME, {
  route: "sync",
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: startSyncHandler
});

if (environment.sync.scheduleEnabled) {
  app.timer(FUNCTION_NAME + "Timer", {
    schedule: environment.sync.schedule,
    runOnStartup: !environment.production,
    extraInputs: [df.input.durableClient()],
    handler: startSyncHandler
  });
}
