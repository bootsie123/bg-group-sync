export default {
  production: process.env.APPSETTING_FUNCTIONS_WORKER_RUNTIME
    ? true
    : process.env.NODE_ENV === "production",
  sync: {
    schedule: process.env.SYNC_SCHEDULE || "0 0 0 * * *",
    scheduleEnabled: process.env.SYNC_SCHEDULE_ENABLED === "true",
    syncStudents: process.env.SYNC_STUDENTS === "true",
    syncParents: process.env.SYNC_PARENTS === "true",
    syncStudentEmails: process.env.SYNC_STUDENT_EMAILS === "true",
    createAccounts: process.env.SYNC_CREATE_ACCOUNTS === "true"
  },
  blackbaud: {
    oauth: {
      id: process.env.BLACKBAUD_OAUTH_ID,
      secret: process.env.BLACKBAUD_OAUTH_SECRET,
      tokenHost: process.env.BLACKBAUD_OAUTH_TOKEN_HOST || "https://oauth2.sky.blackbaud.com",
      authorizePath: process.env.BLACKBAUD_OAUTH_AUTHORIZE_PATH || "/authorization",
      tokenPath: process.env.BLACKBAUD_OAUTH_TOKEN_PATH || "/token"
    },
    sky: {
      skyAPIEndpoint: process.env.BLACKBAUD_SKY_API_ENDPOINT || "https://api.sky.blackbaud.com",
      subscriptionKey: process.env.BLACKBAUD_SUBSCRIPTION_KEY
    },
    sync: {
      studentRole: process.env.BLACKBAUD_STUDENT_ROLE || "Student",
      parentRole: process.env.BLACKBAUD_PARENT_ROLE || "Parent",
      pastParentRoles:
        process.env.BLACKBAUD_PAST_PARENT_ROLES || "Parent of Past Student, Parent of Alumni"
    }
  },
  google: {
    auth: {
      serviceEmail: process.env.GOOGLE_AUTH_SERVICE_EMAIL,
      serviceKey: process.env.GOOGLE_AUTH_SERVICE_KEY
    },
    domain: process.env.GOOGLE_DOMAIN,
    accountCreationPassword:
      process.env.GOOGLE_ACCOUNT_CREATION_PASSWORD || "TEMP_PASSWORD_CHANGE_THIS!",
    accountCreationOrgUnitPath: process.env.GOOGLE_ACCOUNT_CREATION_ORG_UNIT_PATH || "/",
    accountCreationMinGradYear: parseInt(process.env.GOOGLE_ACCOUNT_CREATION_MIN_GRAD_YEAR, 10),
    studentGroupEmailPrefix: process.env.GOOGLE_STUDENT_GROUP_EMAIL_PREFIX || "students",
    studentGroupName: process.env.GOOGLE_STUDENT_GROUP_NAME || "Class of ",
    // See https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#resource for exact group settings
    studentGroupPermissions: {
      whoCanAdd: process.env.GOOGLE_STUDENT_WHO_CAN_ADD || "ALL_MANAGERS_CAN_ADD",
      whoCanJoin: process.env.GOOGLE_STUDENT_WHO_CAN_JOIN || "INVITED_CAN_JOIN",
      whoCanViewMembership:
        process.env.GOOGLE_STUDENT_WHO_CAN_VIEW_MEMBERSHIP || "ALL_MANAGERS_CAN_VIEW",
      whoCanViewGroup: process.env.GOOGLE_STUDENT_WHO_CAN_VIEW_GROUP || "ALL_MEMBERS_CAN_VIEW",
      whoCanInvite: process.env.GOOGLE_STUDENT_WHO_CAN_INVITE || "ALL_MANAGERS_CAN_INVITE",
      whoCanPostMessage:
        process.env.GOOGLE_STUDENT_WHO_CAN_POST_MESSAGE || "ALL_IN_DOMAIN_CAN_POST",
      whoCanLeaveGroup: process.env.GOOGLE_STUDENT_WHO_CAN_LEAVE_GROUP || "ALL_MANAGERS_CAN_LEAVE",
      whoCanContactOwner:
        process.env.GOOGLE_STUDENT_WHO_CAN_CONTACT_OWNER || "ALL_MANAGERS_CAN_CONTACT",
      whoCanDiscoverGroup:
        process.env.GOOGLE_STUDENT_WHO_CAN_DISCOVER_GROUP || "ALL_MEMBERS_CAN_DISCOVER"
    },
    parentGroupEmailPrefix: process.env.GOOGLE_PARENT_GROUP_EMAIL_PREFIX || "parents",
    parentGroupName: process.env.GOOGLE_PARENT_GROUP_NAME || "Parents of ",
    parentGroupPermissions: {
      whoCanAdd: process.env.GOOGLE_PARENT_WHO_CAN_ADD || "ALL_MANAGERS_CAN_ADD",
      whoCanJoin: process.env.GOOGLE_PARENT_WHO_CAN_JOIN || "INVITED_CAN_JOIN",
      whoCanViewMembership:
        process.env.GOOGLE_PARENT_WHO_CAN_VIEW_MEMBERSHIP || "ALL_MANAGERS_CAN_VIEW",
      whoCanViewGroup: process.env.GOOGLE_PARENT_WHO_CAN_VIEW_GROUP || "ALL_MEMBERS_CAN_VIEW",
      whoCanInvite: process.env.GOOGLE_PARENT_WHO_CAN_INVITE || "ALL_MANAGERS_CAN_INVITE",
      whoCanPostMessage: process.env.GOOGLE_PARENT_WHO_CAN_POST_MESSAGE || "ANYONE_CAN_POST",
      whoCanLeaveGroup: process.env.GOOGLE_PARENT_WHO_CAN_LEAVE_GROUP || "ALL_MEMBERS_CAN_LEAVE",
      whoCanContactOwner:
        process.env.GOOGLE_PARENT_WHO_CAN_CONTACT_OWNER || "ALL_MEMBERS_CAN_CONTACT",
      whoCanDiscoverGroup:
        process.env.GOOGLE_PARENT_WHO_CAN_DISCOVER_GROUP || "ALL_MEMBERS_CAN_DISCOVER",
      allowExternalMembers: true
    }
  },
  smtp: {
    reportsEnabled: process.env.SMTP_REPORTS_ENABLED === "true",
    reportFrequency: process.env.SMTP_REPORT_FREQUENCY,
    toEmail: process.env.SMTP_TO_EMAIL,
    sendAsEmail: process.env.SMTP_SEND_AS_EMAIL,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    useTLS: process.env.SMTP_USE_TLS === "true",
    auth: {
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD
    }
  }
};
