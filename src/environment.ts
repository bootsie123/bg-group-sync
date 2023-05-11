const parseSyncMap = (data: string) => {
  data = data.replace(/'/g, '"');

  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load sync map from settings:", err);

    return {};
  }
};

export default {
  production: process.env.NODE_ENV === "production",
  sync: {
    schedule: process.env["SYNC_SCHEDULE"] || "0 0 0 * * *",
    scheduleEnabled: false,
    map: parseSyncMap(process.env["SYNC_MAP"])
  },
  blackbaud: {
    oauth: {
      id: process.env["BLACKBAUD_OAUTH_ID"],
      secret: process.env["BLACKBAUD_OAUTH_SECRET"],
      tokenHost: process.env["BLACKBAUD_OAUTH_TOKEN_HOST"] || "https://oauth2.sky.blackbaud.com",
      authorizePath: process.env["BLACKBAUD_OAUTH_AUTHORIZE_PATH"] || "/authorization",
      tokenPath: process.env["BLACKBAUD_OAUTH_TOKEN_PATH"] || "/token"
    },
    sky: {
      skyAPIEndpoint: process.env["BLACKBAUD_SKY_API_ENDPOINT"] || "https://api.sky.blackbaud.com",
      subscriptionKey: process.env["BLACKBAUD_SUBSCRIPTION_KEY"]
    },
    sync: {
      groupListId: process.env["BLACKBAUD_GROUP_LIST_ID"]
    }
  },
  google: {
    auth: {
      serviceEmail: process.env["GOOGLE_AUTH_SERVICE_EMAIL"],
      serviceKey: process.env["GOOGLE_AUTH_SERVICE_KEY"]
    }
  }
};
