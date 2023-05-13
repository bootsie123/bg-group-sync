import {
  admin_directory_v1 as adminDirectoryV1,
  google,
  groupssettings_v1 as GroupsSettingsV1
} from "googleapis";

import { GaxiosError } from "gaxios";
import { MethodOptions } from "googleapis/build/src/apis/abusiveexperiencereport";

import environment from "../environment";

const scopes = [
  "https://www.googleapis.com/auth/admin.directory.group",
  "https://www.googleapis.com/auth/admin.directory.group.member",
  "https://www.googleapis.com/auth/admin.directory.group.member.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.readonly",
  "https://www.googleapis.com/auth/admin.directory.user",
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/apps.groups.settings"
];

/**
 * Responsible for handling all communication with the Google SDKs
 */
export class GoogleAPI {
  /** The Google Admin SDK instance */
  private directory: adminDirectoryV1.Admin;

  /** The Google GroupsSettings SDK instance */
  private groupsSettings: GroupsSettingsV1.Groupssettings;

  /**
   * Creates a new instance of the GoogleAPI. Uses environment variables for authentication
   */
  constructor() {
    const googleAuth = new google.auth.JWT(
      environment.google.auth.serviceEmail,
      null,
      environment.google.auth.serviceKey.split(String.raw`\n`).join("\n"),
      scopes,
      null
    );

    this.directory = google.admin({ version: "directory_v1", auth: googleAuth });

    google.options({ auth: googleAuth });

    this.groupsSettings = google.groupssettings("v1");
  }

  /**
   * Handles errors from Google SDK requests and parses the HTTP response
   * to compile a list of error messages
   * @param error A {@link GaxiosError} recieved from a failed HTTP request
   * @returns A comma seperated list of error messages
   */
  private apiErrorHandler(error: GaxiosError) {
    const data = error.response.data;

    const errors = data.error.errors.map(error => error.message);

    return errors.join(",");
  }

  /**
   * Retrieves a list of users matching the specified query
   * @param params The parameters to use for the query
   * @param options Additional options
   * @returns A list of {@link adminDirectoryV1.Schema$Users} users matching the query
   */
  async listUsers(
    params: adminDirectoryV1.Params$Resource$Users$List,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$Users> {
    try {
      const res = await this.directory.users.list(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Retrieves a list of groups matching the specified query
   * @param params The parameters to use for the query
   * @param options Additional options
   * @returns A list of {@link adminDirectoryV1.Schema$Groups} groups matching the query
   */
  async listGroups(
    params: adminDirectoryV1.Params$Resource$Groups$List,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$Groups> {
    try {
      const res = await this.directory.groups.list(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Retrieves a group using its ID
   * @param params The parameters containing the group ID
   * @param options Additional options
   * @returns The found {@link adminDirectoryV1.Schema$Group} group
   */
  async getGroup(
    params: adminDirectoryV1.Params$Resource$Groups$Get,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$Group> {
    try {
      const res = await this.directory.groups.get(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Creates a group using the specified parameters
   * @param params The parameters to use for group creation
   * @param options Additional options
   * @returns The newly created {@link adminDirectoryV1.Schema$Group} group
   */
  async createGroup(
    params: adminDirectoryV1.Params$Resource$Groups$Insert,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$Group> {
    try {
      const res = await this.directory.groups.insert(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Updates the permission settings of a group
   * @param params The parameters of the updated settings
   * @param options Additional options
   * @returns The updated {@link GroupsSettingsV1.Schema$Groups} group
   */
  async updateGroupSettings(
    params: GroupsSettingsV1.Params$Resource$Groups$Patch,
    options?: MethodOptions
  ): Promise<GroupsSettingsV1.Schema$Groups> {
    try {
      const res = await this.groupsSettings.groups.patch(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Adds a member to the specified group
   * @param params The parameters containing the group ID and member to add
   * @param options Additional options
   * @returns The newly added {@link adminDirectoryV1.Schema$Member} member
   */
  async addMemberToGroup(
    params: adminDirectoryV1.Params$Resource$Members$Insert,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$Member> {
    try {
      const res = await this.directory.members.insert(params, options);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }
}
