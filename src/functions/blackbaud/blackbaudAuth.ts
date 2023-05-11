import { HttpRequest, HttpResponseInit, app } from "@azure/functions";

import { authorizeURL } from "../../lib/OAuth2.js";

export const FUNCTION_NAME = "blackbaudAuth";

/**
 * Starts the OAuth2 authentication flow to Blackbaud for first time setup
 * @param req An HTTP request
 * @returns An HTTP response redirecting to the Blackbaud OAuth page for the application
 */
export async function blackbauthAuthTrigger(req: HttpRequest): Promise<HttpResponseInit> {
  const uri = authorizeURL(req.url + "/callback");

  return {
    status: 302,
    headers: {
      Location: uri
    }
  };
}

app.http(FUNCTION_NAME, {
  route: "auth",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: blackbauthAuthTrigger
});
