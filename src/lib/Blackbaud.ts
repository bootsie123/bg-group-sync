import axios, { AxiosInstance } from "axios";
import * as df from "durable-functions";
import { AccessToken } from "simple-oauth2";

import environment from "../environment";
import { Logger, LoggingStream, Severity } from "./Logger";

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
  /**
   * Stream to use when logging
   */
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
    this.initAccessToken();
  }

  /**
   * Initalizes the Axios instance used for making HTTP requests to the SKY API
   */
  private initAxiosInstance() {
    const http = axios.create(axiosConfig);

    // Handles automatic refreshing of expired access tokens
    http.interceptors.response.use(
      res => {
        return res;
      },
      async err => {
        const originalReq = err.config;

        if (err.response.status === 401 && !originalReq._retry) {
          originalReq._retry = true;

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
        }

        return Promise.reject(err);
      }
    );

    this.http = http;
  }

  /**
   * Initializes the {@link AccessToken} used by the SKY API.
   * An error will be thrown if a Blackbaud account is not linked or the refresh token is expired.
   */
  private async initAccessToken() {
    const entity = await this.client.readEntityState(this.entity);

    const accessToken: AccessToken = entity.entityState;

    if (!accessToken) {
      throw new Error(
        "[Blackbaud] No refresh token found! You must link a Blackbaud account before syncing"
      );
    }

    if (accessToken.expired()) {
      throw new Error("[Blackbaud] Refresh token expired. Must relink OAuth2 account");
    }

    this.logger.log(Severity.Info, "Account already linked");

    this.accessToken = accessToken;
  }

  /**
   * Refreshes the {@link AccessToken} and refreshToken used by the SKY API and saves it to persistant storage
   * @returns The new {@link AccessToken}
   */
  async refreshAccessToken(): Promise<AccessToken> {
    try {
      const accessToken: AccessToken = await this.accessToken.refresh();

      this.http.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken.token.access_token}`;

      this.client.signalEntity(this.entity, "set", accessToken);

      this.accessToken = accessToken;

      return accessToken;
    } catch (err) {
      this.logger.log(Severity.Error, "Error refreshing access token:", err);

      return Promise.reject(err);
    }
  }

  getMe() {
    return this.http.get("users/me");
  }

  getListOfLists() {
    return this.http.get("lists");
  }

  getList(listId, page = 1, pageSize = 1000) {
    return this.http.get(`lists/advanced/${listId}`, {
      params: {
        page,
        page_size: pageSize
      }
    });
  }
}
