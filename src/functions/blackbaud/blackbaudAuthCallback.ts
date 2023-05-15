import { HttpRequest, HttpResponseInit, InvocationContext, app } from "@azure/functions";
import * as df from "durable-functions";
import * as pug from "pug";

import { getTokenFromCode } from "../../lib/OAuth2";
import { Logger, Severity } from "../../lib/Logger";
import { ENTITY_ID as authEntity } from "./blackbaudAuthEntity";

const template = pug.compileFile(__dirname + "/../../templates/callback.pug");

export const FUNCTION_NAME = "blackbaudAuthCallback";

/**
 * A helper function which logs errors and returns the corresponding HTTP response
 * @param logger The {@link Logger} to use for logging
 * @returns A function which takes in an error string and returns a {@link HttpResponseInit}
 */
function logError(logger: Logger) {
  return (errorText: string): HttpResponseInit => {
    logger.log(Severity.Error, errorText);

    return {
      status: 400,
      headers: {
        "content-type": "text/html"
      },
      body: template({
        success: false,
        errorText
      })
    };
  };
}

/**
 * Handles the callback recieved from the Blackbaud OAuth2 flow
 * @param req An HTTP request
 * @param context The invocation context of the function
 * @returns An HTTP response containing the result of the Blackbaud OAuth2 flow
 */
export async function blackbaudAuthCallbackHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const logger = new Logger(context, "Blackbaud");

  const errorHandler = logError(logger);

  const query = req.query;

  const code = query.get("code");

  if (query.has("error")) {
    const errorText = `Error from Blackbaud OAuth2 forwarded to callback\n\n
                      Error: ${query.get("error")}\n
                      Message: ${query.get("errorMessage")}\n
                      Description: ${query.get("errorDescription")}`;

    return errorHandler(errorText);
  }

  if (!code) {
    const errorText = "Error from Blackbaud OAuth2 callback\n\nError: No OAuth2 code found";

    return errorHandler(errorText);
  }

  const url = new URL(req.url);

  try {
    const data = await getTokenFromCode(code, url.origin + url.pathname);

    const client = df.getClient(context);

    client.signalEntity(authEntity, "set", data.token);
  } catch (err) {
    const errorText = `Error confirming Blackbaud OAuth2 callback code\n\nError: ${err.message}`;

    return errorHandler(errorText);
  }

  logger.log("info", "OAuth2 account linked successfully!");

  return {
    status: 200,
    headers: {
      "content-type": "text/html"
    },
    body: template({
      success: true
    })
  };
}

app.http(FUNCTION_NAME, {
  route: "auth/callback",
  methods: ["GET"],
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: blackbaudAuthCallbackHandler
});
