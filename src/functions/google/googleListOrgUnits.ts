import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import { admin_directory_v1 as adminDirectoryV1 } from "googleapis";

import { Logger, Severity } from "../../lib/Logger";
import { GoogleAPI } from "../../lib/Google";

export const FUNCTION_NAME = "googleListOrgUnits";

/**
 * Finds multiple organization units under the Google domain using the given query
 * @param orgUnitPath The organizational unit path to for/in
 * @param context The invocation context for the function
 * @returns A list of {@link adminDirectoryV1.Schema$OrgUnit} organizational units if found, otherwise undefined
 */
export async function googleListOrgUnits(
  orgUnitPath: string,
  context: InvocationContext
): Promise<adminDirectoryV1.Schema$OrgUnit[]> {
  const logger = new Logger(context, "Google");

  const google = new GoogleAPI();

  try {
    const orgList = await google.listOrgUnits({
      orgUnitPath,
      type: "ALL",
      customerId: await google.customerId
    });

    if (!orgList.organizationUnits) {
      return undefined;
    }

    return orgList.organizationUnits;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", orgUnitPath);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: googleListOrgUnits
});
