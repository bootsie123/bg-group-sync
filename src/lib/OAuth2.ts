import { AuthorizationCode } from "simple-oauth2";

import environment from "../environment";

const authConfig = {
  client: {
    id: environment.blackbaud.oauth.id,
    secret: environment.blackbaud.oauth.secret
  },
  auth: {
    tokenHost: environment.blackbaud.oauth.tokenHost,
    authorizePath: environment.blackbaud.oauth.authorizePath,
    tokenPath: environment.blackbaud.oauth.tokenPath
  },
  options: {
    authorizationMethod: "body"
  }
};

export const client: AuthorizationCode = new AuthorizationCode(authConfig);

/**
 * Creates the authorization URL using the specified redirect URI
 * @param redirectUri The URI to redirect to after authentication
 * @returns The authorization URL with the specified options
 */
export function authorizeURL(redirectUri) {
  return client.authorizeURL({
    redirect_uri: redirectUri
  });
}

/**
 *  Gets a token using an authorization code recieved from a callback URL
 * @param code The authorization code from the callback URL
 * @param redirectUri The redirect URI used to get the auth code
 * @returns An {@link AccessToken} object if successful
 */
export function getTokenFromCode(code, redirectUri) {
  return client.getToken(
    {
      code,
      redirect_uri: redirectUri
    },
    { json: true }
  );
}
