import { HttpRequest, HttpResponseInit, InvocationContext, app } from "@azure/functions";
import * as df from "durable-functions";
import * as pug from "pug";

import { authorizeURL } from "../lib/OAuth2.js";

import { ENTITY_ID as authEntity } from "./blackbaud/blackbaudAuthEntity";

const template = pug.compileFile(__dirname + "/../templates/setup.pug");

export const FUNCTION_NAME = "setup";

/**
 * Returns the setup page needed for final app configuration
 * @param req An {@link HttpRequest}
 * @param context The invocation context of the function
 * @returns The HTML setup page
 */
export async function setupTrigger(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const client = df.getClient(context);

  const entity = await client.readEntityState(authEntity);

  const uri = authorizeURL(req.url + "/callback");

  return {
    status: 200,
    headers: {
      "content-type": "text/html"
    },
    body: template({
      pageTitle: "Setup",
      setupComplete: entity.entityExists,
      uri
    })
  };
}

app.http(FUNCTION_NAME, {
  route: "setup",
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: setupTrigger
});
