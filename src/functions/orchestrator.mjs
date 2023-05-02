import { app } from "@azure/functions";
import * as df from "durable-functions";

import { BlackbaudAPI } from "../lib/blackbaud.mjs";

import logger from "../lib/logger.mjs";
import environment from "../environment.mjs";

const FUNCTION_NAME = "syncOrchestration";

df.app.orchestration(FUNCTION_NAME, function* (context) {
  const log = logger.createFromContext(context, "Orchestrator");

  log("info", "Starting sync job...");

  try {
    const blackbaud = BlackbaudAPI.fromObject(
      yield context.df.callActivity("blackbaudAuthenticate")
    );

    //TODO Make blackbaudFetchGroups initialize BlackbaudAPI object directly

    let groups = yield context.df.callActivity(
      "blackbaudFetchGroups",
      blackbaud
    );

    if (groups.length < 1) {
      return log("warning", "No groups found. Skipping Google sync");
    }

    const syncMap = environment.syncMap;

    groups = groups.filter((group) => syncMap[group.id]);

    const tasks = [];

    for (const group of groups) {
      tasks.push(
        context.df.callActivity("googleUpdateGroup", {
          googleGroupId: syncMap[group.id],
          blackbaudGroup: group
        })
      );
    }

    if (tasks.length < 1) {
      return log("info", "No tasks left to do. Sync complete!");
    }

    yield context.df.Task.all(tasks);

    log("info", "Sync completed successfully");
  } catch (err) {
    log("error", "Orchestration Error:", err);
  }
});

const startSync = async (context) => {
  const client = df.getClient(context);
  const instanceId = await client.startNew(FUNCTION_NAME);

  context.log(`Started orchestration with ID = ${instanceId}`);
};

app.http("syncStart", {
  route: "startSync",
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: async (req, context) => {
    await startSync(context);

    return {
      status: 200,
      body: "Sync started"
    };
  }
});

/*
app.timer("syncStart", {
  schedule: environment.syncSchedule,
  runOnStartup: !environment.production,
  extraInputs: [df.input.durableClient()],
  handler: async (timer, context) => {
    await startSync(context);
  }
});
*/
