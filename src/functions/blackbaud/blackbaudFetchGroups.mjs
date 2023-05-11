import * as df from "durable-functions";

import environment from "../environment.mjs";
import { BlackbaudAPI } from "../lib/blackbaud.mjs";
import logger from "../lib/logger.mjs";
import utils from "../lib/utils.mjs";

const groupListId = environment.blackbaud.sync.groupListId;

df.app.activity("blackbaudFetchGroups", {
  extraInputs: [df.input.durableClient()],
  handler: async (blackbaudApi, context) => {
    const log = logger.createFromContext(context, "Blackbaud");

    const blackbaud = BlackbaudAPI.fromObject(blackbaudApi);

    const groupMap = {};

    let page = 1;
    let count = 0;

    log("info", "Fetching community group members...");

    do {
      let list;

      try {
        list = (await blackbaud.getList(groupListId, page)).data;
      } catch (err) {
        const data = err.response.data;

        const errors = data.errors
          ? data.errors.map((err) => err.message)
          : [data.message];

        log(
          "error",
          `Error fetching page ${page} of list ID ${groupListId}:`,
          errors.join(", ")
        );

        break;
      }

      count = list.count;

      for (const row of list.results.rows) {
        const data = row.columns.reduce(
          (obj, col) => ({ ...obj, [col.name]: col.value }),
          {}
        );

        const groupId = data["Community ID"];
        const email = data["E-Mail"];

        if (!groupId || !email) continue;

        if (groupMap[groupId]) {
          groupMap[groupId].members.push(email);
        } else {
          groupMap[groupId] = {
            groupId,
            members: [email]
          };
        }
      }

      page++;
    } while (count >= 1000);

    const groups = [];

    for (const [groupId, group] of Object.entries(groupMap)) {
      let members = group.members.filter(
        (member, pos, self) => self.indexOf(member) == pos
      );

      members = members.map((member) => utils.sanitizeEmail(member));

      groups.push({ id: groupId, members });
    }

    log("info", `${groups.length} community groups found`);

    return groups;
  }
});
