import { AuthorizationCode } from "simple-oauth2";
import axios from "axios";

import environment from "../environment.mjs";
import logger from "./logger.mjs";

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

const axiosConfig = {
  baseURL: environment.blackbaud.sky.skyAPIEndpoint + "/school/v1/",
  headers: {
    "Bb-Api-Subscription-Key": environment.blackbaud.sky.subscriptionKey
  }
};

const log = logger.create("BlackbaudAPI");

const client = new AuthorizationCode(authConfig);

/**
 *
 */
export class BlackbaudAPI {
  /**
   *
   * @param {*} ticket
   * @param {*} options
   */
  constructor(ticket, options = {}) {
    this.ticket = ticket;
    this.options = options;

    this.http = this.#initHttp();

    this.#updateAuthHeader();
  }

  /**
   *
   */
  #updateDatastore() {
    const context = this.options?.context;
    const entity = this.options?.entity;

    if (context && entity && context?.df?.signalEntity) {
      context.df.signalEntity(entity, "set", this.ticket);
    }
  }

  /**
   *
   */
  #updateAuthHeader() {
    if (!this.ticket?.access_token) return;

    this.http.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.ticket.access_token}`;
  }

  /**
   *
   * @return {*}
   */
  #initHttp() {
    const http = axios.create(axiosConfig);

    http.interceptors.response.use(
      (res) => {
        return res;
      },
      async (err) => {
        const originalReq = err.config;

        if (err.response.status === 401 && !originalReq._retry) {
          originalReq._retry = true;

          log(
            "warning",
            "Access token possibly expired. Auto refreshing token..."
          );

          try {
            const accessToken = await this.refreshAccessToken();

            originalReq.headers["Authorization"] = `Bearer ${accessToken}`;

            return http(originalReq);
          } catch {
            log("error", "Unable to auto refresh access token");
          }
        }

        return Promise.reject(err);
      }
    );

    return http;
  }

  /**
   *
   * @return {boolean}
   */
  isRefreshTokenExpired() {
    const ticketDate = new Date(this.ticket.expires_at);

    ticketDate.setSeconds(
      ticketDate.getSeconds() + this.ticket.refresh_token_expires_in
    );

    return ticketDate < Date.now();
  }

  /**
   *
   */
  async refreshAccessToken() {
    const accessToken = client.createToken(this.ticket);

    console.log(this.ticket);

    try {
      this.ticket = await accessToken.refresh();

      this.#updateAuthHeader();
      this.#updateDatastore();

      return this.ticket.access_token;
    } catch (err) {
      log("error", "Error refreshing access token:", err);

      return Promise.reject(err);
    }
  }

  /**
   *
   * @return {*}
   */
  getMe() {
    return this.http.get("users/me");
  }

  /**
   *
   * @return {*}
   */
  getListOfLists() {
    return this.http.get("lists");
  }

  /**
   *
   * @param {*} listId
   * @param {*} page
   * @param {*} pageSize
   * @return {*}
   */
  getList(listId, page = 1, pageSize = 1000) {
    return this.http.get(`lists/advanced/${listId}`, {
      params: {
        page,
        page_size: pageSize
      }
    });
  }

  /**
   *
   * @param {*} object
   * @return {*}
   */
  static fromObject(object) {
    return Object.assign(
      new BlackbaudAPI(object.ticket, object.options),
      object
    );
  }
}

export const utils = {
  getAuthorizationUri: (redirectUri) => {
    return client.authorizeURL({
      redirect_uri: redirectUri
    });
  },
  getAccessTokenFromCode: (code, redirectUri) => {
    return client.getToken(
      {
        code,
        redirect_uri: redirectUri
      },
      { json: true }
    );
  }
};
