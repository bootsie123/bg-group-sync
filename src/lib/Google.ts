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
  "https://www.googleapis.com/auth/admin.directory.orgunit",
  "https://www.googleapis.com/auth/admin.directory.orgunit.readonly",
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

  /** The customer ID of the set Google Workspace domain */
  customerId: Promise<string>;

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

    this.customerId = this.getCustomerId(environment.google.domain);
  }

  /**
   * Handles errors from Google SDK requests and parses the HTTP response
   * to compile a list of error messages
   * @param error A {@link GaxiosError} recieved from a failed HTTP request
   * @param retry An optional function ran when the Google API rate limit is exceeded
   * @param params The parameters to pass into the retry function
   * @returns A comma seperated list of error messages
   */
  private async apiErrorHandler(error: GaxiosError, retry?, ...params) {
    const data = error.response.data;

    let errors = data.error.errors.map(error => error.message);

    errors = errors.join(",");

    if (errors.includes("Request rate higher than configured")) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (retry) {
        return retry.bind(this)(...params);
      }
    }

    throw errors;
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
      return this.apiErrorHandler(err, this.listUsers, params, options);
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
      return this.apiErrorHandler(err, this.listGroups, params, options);
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
      return this.apiErrorHandler(err, this.getGroup, params, options);
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
      return this.apiErrorHandler(err, this.createGroup, params, options);
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
      return this.apiErrorHandler(err, this.updateGroupSettings, params, options);
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
      return this.apiErrorHandler(err, this.addMemberToGroup, params, options);
    }
  }

  /**
   * Creates a new user
   * @param params The parameters containing the user's name, email, and password
   * @param options Additional options
   * @returns The newly created {@link adminDirectoryV1.Schema$User} user
   */
  async createUser(
    params: adminDirectoryV1.Params$Resource$Users$Insert,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$User> {
    try {
      const res = await this.directory.users.insert(params, options);

      return res.data;
    } catch (err) {
      return this.apiErrorHandler(err, this.createUser, params, options);
    }
  }

  /**
   * Retrieves a list of organizational units using the given OrgUnitPath
   * @param params The parameters to use for the query
   * @param options Additional options
   * @returns A list of {@link adminDirectoryV1.Schema$OrgUnits} organizational units matching the query
   */
  async listOrgUnits(
    params: adminDirectoryV1.Params$Resource$Orgunits$List,
    options?: MethodOptions
  ): Promise<adminDirectoryV1.Schema$OrgUnits> {
    try {
      const res = await this.directory.orgunits.list(params, options);

      return res.data;
    } catch (err) {
      return this.apiErrorHandler(err, this.listOrgUnits, params, options);
    }
  }

  /**
   * Retrieves the customer ID for the given Google Workspace domain
   * @param domain The Google Workspace domain containing the customer ID
   * @returns The customer ID for the domain
   */
  async getCustomerId(domain: string): Promise<string> {
    try {
      const res = await this.directory.users.list({ domain });

      return res.data.users[0].customerId;
    } catch (err) {
      return this.apiErrorHandler(err, this.getCustomerId);
    }
  }
}
