import * as df from "durable-functions";

import logger from "../lib/logger.mjs";
import { GoogleAPI } from "../lib/google.mjs";
import utils from "../lib/utils.mjs";

const entity = new df.EntityId("googleAuthEntity", "auth");

df.app.activity("googleUpdateGroup", {
  extraInputs: [df.input.durableClient()],
  handler: async (inputs, context) => {
    const log = logger.createFromContext(context, "Google");

    const service = new GoogleAPI().service;

    const googleGroupId = inputs.googleGroupId;
    const blackbaudGroup = inputs.blackbaudGroup;

    let googleGroupMembers = [];

    let nextPageToken;

    log("info", `Fetching group members for group ID ${googleGroupId}...`);

    do {
      let res;

      try {
        res = await service.members.list({
          groupKey: googleGroupId,
          maxResults: 200,
          pageToken: nextPageToken,
          roles: "MEMBER"
        });
      } catch (err) {
        const data = err.response.data;

        const errors = data.error.errors.map((error) => error.message);

        log(
          "error",
          `Error fetching members for group ID ${googleGroupId}:`,
          errors.join(", ")
        );

        log(
          "warning",
          `Unable to find process group members for group ID ${googleGroupId}. Attempting with sync anyway`
        );
      }

      const data = res.data;

      nextPageToken = data.nextPageToken;

      if (!data.members) continue;

      const members = data.members.map((member) =>
        utils.sanitizeEmail(member.email)
      );

      googleGroupMembers = googleGroupMembers.concat(members);
    } while (nextPageToken);

    log(
      "info",
      `Found ${googleGroupMembers.length} members in group ID ${googleGroupId}`
    );

    log(
      "info",
      `Attempting to add ${blackbaudGroup.members.length} members to group ID ${googleGroupId}...`
    );

    let membersAdded = 0;

    for (const member of blackbaudGroup.members) {
      if (googleGroupMembers.includes(member)) {
        membersAdded++;

        continue;
      }

      try {
        await service.members.insert({
          groupKey: googleGroupId,
          requestBody: {
            email: member,
            role: "MEMBER"
          }
        });

        googleGroupMembers.push(member);

        membersAdded++;
      } catch (err) {
        const data = err.response.data;

        const errors = data.error.errors.map((error) => error.message);

        log(
          "error",
          `Error adding ${member} to group ID ${googleGroupId}:`,
          errors.join(", ")
        );
      }
    }

    log(
      "info",
      `Added ${membersAdded}/${blackbaudGroup.members.length} members to group ID ${googleGroupId}`
    );

    log("info", `Removing old members from group ID ${googleGroupId}...`);

    let membersRemoved = 0;
    let membersToRemove = 0;

    for (const member of googleGroupMembers) {
      if (blackbaudGroup.members.includes(member)) continue;

      membersToRemove++;

      try {
        await service.members.delete({
          groupKey: googleGroupId,
          memberKey: member
        });

        googleGroupMembers.push(member);

        membersRemoved++;
      } catch (err) {
        const data = err.response.data;

        const errors = data.error.errors.map((error) => error.message);

        log(
          "error",
          `Error removing ${member} from group ID ${googleGroupId}:`,
          errors.join(", ")
        );
      }
    }

    log(
      "info",
      `Removed ${membersRemoved}/${membersToRemove} members from group ID ${googleGroupId}`
    );

    return;
  }
});
