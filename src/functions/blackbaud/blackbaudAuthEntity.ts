import * as df from "durable-functions";
import { AccessToken } from "simple-oauth2";

export const ENTITY_NAME = "blackbaudAuthEntity";

export const ENTITY_ID = new df.EntityId(ENTITY_NAME, "accessToken");

/**
 * Handles the state of the Blackbaud Authentication {@link AccessToken}
 * @param context The invocation context of the entity function
 */
export function blackbaudAuthEntityTrigger(context: df.EntityContext<AccessToken>) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let accessToken = context.df.getState(() => {});

  switch (context.df.operationName) {
    case "set": {
      accessToken = context.df.getInput();

      break;
    }
    case "get": {
      context.df.return(accessToken);

      break;
    }
  }

  context.df.setState(accessToken);
}

df.app.entity(ENTITY_NAME, { handler: blackbaudAuthEntityTrigger });
