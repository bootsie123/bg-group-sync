export default {
  production: process.env.NODE_ENV === "production",
  sync: {
    schedule: process.env["SYNC_SCHEDULE"] || "0 0 0 * * *",
    scheduleEnabled: process.env["SYNC_SCHEDULE_ENABLED"] === "true"
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
      studentRole: process.env["BLACKBAUD_STUDENT_ROLE"] || "Student",
      parentRole: process.env["BLACKBAUD_PARENT_ROLE"] || "Parent"
    }
  },
  google: {
    auth: {
      serviceEmail: process.env["GOOGLE_AUTH_SERVICE_EMAIL"],
      serviceKey: process.env["GOOGLE_AUTH_SERVICE_KEY"]
    },
    domain: process.env["GOOGLE_DOMAIN"],
    studentGroupEmailPrefix: process.env["GOOGLE_STUDENT_GROUP_EMAIL_PREFIX"] || "students",
    studentGroupName: process.env["GOOGLE_STUDENT_GROUP_NAME"] || "Class of ",
    studentGroupPermissions: {
      whoCanAdd: "ALL_MANAGERS_CAN_ADD",
      whoCanJoin: "INVITED_CAN_JOIN",
      whoCanViewMembership: "ALL_MANAGERS_CAN_VIEW",
      whoCanViewGroup: "ALL_MEMBERS_CAN_VIEW",
      whoCanInvite: "ALL_MANAGERS_CAN_INVITE",
      whoCanPostMessage: "ALL_IN_DOMAIN_CAN_POST",
      whoCanLeaveGroup: "ALL_MANAGERS_CAN_LEAVE",
      whoCanContactOwner: "ALL_MANAGERS_CAN_CONTACT",
      whoCanDiscoverGroup: "ALL_MEMBERS_CAN_DISCOVER"
    },
    parentGroupEmailPrefix: process.env["GOOGLE_PARENT_GROUP_EMAIL_PREFIX"] || "parents",
    parentGroupName: process.env["GOOGLE_PARENT_GROUP_NAME"] || "Parents of ",
    parentGroupPermissions: {
      whoCanAdd: "ALL_MANAGERS_CAN_ADD",
      whoCanJoin: "INVITED_CAN_JOIN",
      whoCanViewMembership: "ALL_MANAGERS_CAN_VIEW",
      whoCanViewGroup: "ALL_MEMBERS_CAN_VIEW",
      whoCanInvite: "ALL_MANAGERS_CAN_INVITE",
      whoCanPostMessage: "ANYONE_CAN_POST",
      whoCanLeaveGroup: "ALL_MEMBERS_CAN_LEAVE",
      whoCanContactOwner: "ALL_MEMBERS_CAN_CONTACT",
      whoCanDiscoverGroup: "ALL_MEMBERS_CAN_DISCOVER",
      allowExternalMembers: true
    }
  }
};
