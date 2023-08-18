import axios, { AxiosError, AxiosInstance } from "axios";
import * as df from "durable-functions";
import { AccessToken } from "simple-oauth2";

import environment from "../environment";

import { Logger, LoggingStream, Severity } from "./Logger";
import { createToken } from "./OAuth2";

// Default config for Axios
const axiosConfig = {
  baseURL: environment.blackbaud.sky.skyAPIEndpoint + "/school/v1/",
  headers: {
    "Bb-Api-Subscription-Key": environment.blackbaud.sky.subscriptionKey
  }
};

/**
 * Additional options for the {@link BlackbaudAPI}
 */
export interface BlackbaudAPIOptions {
  /** Stream to use when logging */
  loggingStream?: LoggingStream;
}

/**
 * Responsible for handling all communication with the Blackbaud SKY API
 */
export class BlackbaudAPI {
  /** The {@link DurableClient} to use when raising events with entity instances */
  private client: df.DurableClient;

  /** The entity instance to use for storing AccessToken data */
  private entity: df.EntityId;

  /** The main logging instance */
  private logger: Logger;

  /** The {@link AxiosInstance} to use for all HTTP requests */
  private http: AxiosInstance;

  /** The {@link AccessToken} used for authentication with the SKY API */
  private accessToken: AccessToken;

  /**
   * Creates a new instance of the {@link BlackbaudAPI} using the specified options
   * @param client The {@link df.DurableClient} of the calling method
   * @param entity The {@link df.EntityId} used for storing AccessToken data
   * @param options Additional options for the {@link BlackbaudAPI} to use
   */
  constructor(
    client: df.DurableClient,
    entity: df.EntityId,
    options: BlackbaudAPIOptions = { loggingStream: console }
  ) {
    this.client = client;
    this.entity = entity;

    this.logger = new Logger(options.loggingStream, "BlackbaudAPI");

    this.initAxiosInstance();
  }

  /**
   * Initalizes the Axios instance used for making HTTP requests to the SKY API
   */
  private initAxiosInstance() {
    const http = axios.create(axiosConfig);

    // Injects the current access token into the Authorization header
    http.interceptors.request.use(config => {
      config.headers["Authorization"] = `Bearer ${this.accessToken.token.access_token}`;

      return config;
    });

    // Handles automatic refreshing of expired access tokens
    http.interceptors.response.use(
      res => {
        return res;
      },
      async err => {
        const originalReq = err.config;

        if (err.response.status === 401 && !originalReq._retry) {
          originalReq._retry = true;

          console.log(err.response.data);

          this.logger.log(
            Severity.Warning,
            "Access token possibly expired. Auto refreshing token..."
          );

          try {
            const accessToken = await this.refreshAccessToken();

            originalReq.headers["Authorization"] = `Bearer ${accessToken.token.access_token}`;

            return http(originalReq);
          } catch {
            this.logger.log(Severity.Error, "Unable to auto refresh access token");
          }
        } else if (err.response.status === 429) {
          const retryAfter = parseInt(err.response.headers["retry-after"]) + 3;

          this.logger.log(
            Severity.Warning,
            `Rate limit reached. Retrying after ${retryAfter} seconds`
          );

          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

          return http(originalReq);
        }

        throw err;
      }
    );

    this.http = http;
  }

  /**
   * Initializes the {@link AccessToken} used by the SKY API.
   * An error will be thrown if a Blackbaud account is not linked or the refresh token is expired.
   */
  public async init() {
    const entity = await this.client.readEntityState(this.entity);

    const notLinkedError =
      "[BlackbaudAPI] No refresh token found! You must link a Blackbaud account before syncing";

    if (!entity.entityExists) {
      throw new Error(notLinkedError);
    }

    const accessToken: AccessToken = createToken(entity.entityState);

    if (!accessToken) {
      throw new Error(notLinkedError);
    }

    this.accessToken = accessToken;

    if (!accessToken.expired()) return;

    try {
      await this.refreshAccessToken();
    } catch (err) {
      throw new Error("[BlackbaudAPI] Refresh token expired. Must relink OAuth2 account");
    }
  }

  /**
   * Handles errors from Blackbaud API requests and parses the HTTP response
   * to compile a list of error messages
   * @param error An {@link AxiosError} recieved from a failed Axios request
   * @returns A comma seperated list of error messages
   */
  private apiErrorHandler(error: AxiosError): string {
    let errors = [];

    if (error?.response?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = error.response.data;

      errors = data.errors
        ? data.errors.map(err => (err.message ? err.message : err.raw_message))
        : [data.message];
    } else {
      errors = [error?.message || error?.toString() || error];
    }

    return errors.join(",");
  }

  /**
   * Refreshes the {@link AccessToken} and refreshToken used by the SKY API and saves it to persistant storage
   * @returns The new {@link AccessToken}
   */
  async refreshAccessToken(): Promise<AccessToken> {
    try {
      const accessToken: AccessToken = await this.accessToken.refresh();

      this.client.signalEntity(this.entity, "set", accessToken.token);

      this.accessToken = accessToken;

      return accessToken;
    } catch (err) {
      this.logger.log(Severity.Error, "Error refreshing access token:", err);

      throw err;
    }
  }

  /**
   * Retrieves a list of core school user roles
   * @returns A list of user roles
   */
  async getRoles() {
    try {
      const res = await this.http.get("roles");

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Retrieves a list of all users with the specified roles
   * @param roleIds An array of role IDs to match
   * @param marker The record number to start at for the batch of data
   * @param extended True if the extended user information should be returned
   * @returns A list of users which have the specified roles
   */
  async getUsersByRoles(roleIds: number[], marker = 1, extended = false) {
    const roles = roleIds.join(",");

    try {
      const res = await this.http.get(extended ? "users/extended" : "users", {
        params: {
          roles,
          base_role_ids: roles,
          marker
        }
      });

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Retrieves information about the specified user
   * @param userId The ID of the user to retrieve
   * @param extended True if extended data should be returned (defaults to false)
   * @returns The information on the user
   */
  async getUser(userId: number, extended = false) {
    const uri = extended ? "users/extended/" : "users/";

    try {
      const res = await this.http.get(uri + userId);

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Retrieves information about the current user
   * @returns The information on the current user
   */
  async getMe() {
    try {
      const res = await this.http.get("users/me");

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }

  /**
   * Updates the email address of a user to a new email
   * @param userId The ID of the user to update the email of
   * @param email The new email address
   * @returns The ID of the user just updated
   */
  async updateUserEmail(userId: number, email: string) {
    try {
      const res = await this.http.patch("users", {
        id: userId,
        email
      });

      return res.data;
    } catch (err) {
      throw this.apiErrorHandler(err);
    }
  }
}
