import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

import environment from "../../environment";

export const FUNCTION_NAME = "googleFindGroups";

/**
 * Finds Google Groups using the specified query
 * @param params A {@link adminDirectoryV1.Params$Resource$Groups$List} object with query options
 * @param context The invocation context for the function
 * @returns A list of {@link adminDirectoryV1.Schema$Group} groups if found, otherwise undefined
 */
export async function googleFindGroups(
  params: adminDirectoryV1.Params$Resource$Groups$List,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$Group[]> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const groupList = await google.listGroups({
      domain: environment.google.domain,
      ...params
    });

    return groupList.groups;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", params);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleFindGroups
});
