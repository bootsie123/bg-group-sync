import { google } from "googleapis";

import environment from "../environment.mjs";
import logger from "./logger.mjs";

const scopes = [
  "https://www.googleapis.com/auth/admin.directory.group",
  "https://www.googleapis.com/auth/admin.directory.group.member",
  "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.readonly"
];

const log = logger.create("GoogleAPI");

/**
 *
 */
export class GoogleAPI {
  /**
   *
   * @param {*} context
   * @param {*} entity
   */
  constructor() {
    const googleAuth = new google.auth.JWT(
      environment.google.auth.serviceEmail,
      null,
      environment.google.auth.serviceKey.split(String.raw`\n`).join("\n"),
      scopes,
      null
    );

    this.service = google.admin({ version: "directory_v1", auth: googleAuth });
  }
}
