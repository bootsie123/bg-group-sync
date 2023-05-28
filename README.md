# BG Group Sync

[![Deploy To Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fgithub.com%2Fbootsie123%2Fbg-group-sync%2Fblob%2Fmain%2Fazuredeploy.bicep)
[![License](https://img.shields.io/github/license/bootsie123/bg-group-sync)](https://github.com/bootsie123/bg-group-sync/blob/main/LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bootsie123/bg-group-sync)](https://github.com/bootsie123/bg-group-sync/blob/main/package.json)

An automated tool to sync parents and students in Blackbaud to Google Groups.

Google Groups offers a convient way to have mailing and distribution lists for teachers, parents, and students. However, manually maintaining the members of each individual group can become time consuming and combersome. If your school makes use of Blackbaud as your SIS, then you're in luck! BG Group Sync offers a convient way to find users in Blackbaud and automatically add them to the appropriate Google Groups.

## Features

- Custom sync schedules
- Ability to specify both parent and student Blackbaud roles to use
- Individual control over whether to sync parents and/or students
- Automatic creation of missing Google Groups (including auto naming and setting of default permissions)
- Automatic updating of student emails in Blackbaud (matches a students email in Blackbaud with their email found in the Google domain)
- Built to be hosted using Azure Functions (free plan)
- Self hosted end to end

## Example Use Case

Take a school which uses Google Groups to manage mailing lists for parents and students based off of graduation year. For each graduation year, they use the following naming scheme for their Google Groups:

Class of 2023 - students23@school.org
Parents of 2023 - parents23@school.org

If all active students have a particular role in Blackbaud, for example `Student`, and all parents have a role, for example `Parent`, then BG Group Sync can work its magic!

Here's what the sync process for students would look like:

1. Starting with all users who have the `Student` role in Blackbaud, we'll try to find each user in the Google domain by first using their email in Blackbaud, then by their first name and last name, and then finally by their Blackbaud preferred name and last name. As a secondary check in the case of multiple students with the same name, it's assumed that the student being matched will have an email address that contains at least the last 2 digits of their graduation year.

2. Once a match is found, the student's email address will automatically be updated in Blackbaud to match the email address of the user found in Google.

3. Now, using the naming scheme provided in the setup options (in this case, "Class of" plus the graduation year), the Google Group is found or created automatically if it doesn't exist.

4. Finally, the student is added to the Google Group if they weren't a member already

The sync process for parents is very similar and looks like the following:

1. Starting with all users who have the `Parent` role in Blackbaud, we'll use their relationships within Blackbaud to create a list of their active students.

2. For each active student found, we'll search for a corresponding Google Group using the naming scheme provided in the setup options (in this case, "Parents of" plus the graduation year). If a corresponding Google Group is not found, it will automatically be created.

3. From there, the parent is added to each of the Google Groups if they weren't a member already

## Installation

First, clone the repository using [git](https://git-scm.com/) and then use [npm](https://www.npmjs.com/) to install the necessary node modules. If [Node.js](https://nodejs.org/) is not already installed, please do so before running npm.

```bash
# Clone the repository
git clone https://github.com/bootsie123/bg-group-sync.git

# Enter the directory
cd bg-group-sync

# Install the dependencies
npm install
```

Next, copy `default.settings.json` to `local.settings.json`.

```bash
cp default.settings.json local.settings.json
```

_Note: The project must be configured before it can be ran_

## Configuration

Due to the nature of this project, there is unfortunately quite a bit of configuration that must be done before it can be ran. See the 3 sections before on how this can be accomplished.

### Blackbaud SKY API Application

This application makes use of Blackbaud's SKY API in order to communicate with your Blackbaud environment. To retrieve the necessary `BLACKBAUD_OAUTH_ID`, `BLACKBAUD_OAUTH_SECRET`, and `BLACKBAUD_SUBSCRIPTION_KEY` values, please follow the steps below to setup a SKY API developer account and application.

1. First, create a SKY API developer account if you don't already have one according to the [Getting Started](https://developer.blackbaud.com/skyapi/docs/getting-started) guide.

2. Next, to create a SKY API application, click on "My account" from the SKY API [home page](https://developer.blackbaud.com/skyapi/). Then, click on "My applications" and then "Add". Enter the details of the application (since this won't be published to the Blackbaud Marketplace you can enter anything) and then click on "Save".

3. Now, to get the application's OAuth ID, click on the newly made application and then click on "Show" under "Application ID (OAuth client_id)" and use the revealed string for `BLACKBAUD_OAUTH_ID`. Then to retrieve the OAuth secret, click on "Show" under "Primary application secret (OAuth client_secret)" and use the revealed string for `BLACKBAUD_OAUTH_SECRET`.

4. Under "Redirect URIs", click on "Edit" and then "Add a redirect URI". If you're running the application locally, enter `http://localhost:7071/setup/callback`. Otherwise, add the domain name being used plus the following path: `/setup/callback`.

5. To connect the application to your Blackbaud environment, click on "Copy links" -> "Connect application link" and visit the copied URL. The web page will guide you through the process of connecting the application to your environment.

6. For the subscription key, go back to your application list and then click on "My subscriptions" in the left navbar. Next, click on "Show" to the right of "Primary access key" and use the revealed string for `BLACKBAUD_SUBSCRIPTION_KEY`.

The application should now have access to your Blackbaud SKY API application!

### Google Cloud Console

To interact with your Google Admin environment, this application uses Google's Admin SDK API. In order to retrieve the necessary `GOOGLE_AUTH_SERVICE_EMAIL` and `GOOGLE_AUTH_SERVICE_KEY` values, please follow the steps below to setup a new project and API service account.

1. To create a new project, first go to the [Google Cloud Console](https://console.cloud.google.com/) and login with an account under your Google domain. Then in the top left hand side of the top navbar, click on your organization's name and then "NEW PROJECT". Enter the name of the project and make sure the organization matches the Google domain being used with the application. Afterwards, click on "CREATE" to create the project.

2. Now, to enable the Admin SDK API, select your newly created project at the top left of the navbar and click on "APIs & Services" under "Quick access" or under the left hand side navbar. From there, click on "ENABLE APIS AND SERVICES" and search for "Admin SDK API". Once found, click on it and then click "ENABLE".

3. Next, to create a service account, click on the hamburger menu in the top left and then "APIs & Services" -> "Credentials". Now, click on "CREATE CREDENTIALS" -> "Service account". Fill in the necessary details and then click on "CREATE AND CONTINUE". Afterwards, click on "DONE".

4. In order to create login credentials for the service account, click on the newly created account under "Service Accounts" and then click on "KEYS". Then, click on "ADD KEY" -> "Create new key". From there, select JSON and then "CREATE". Then, open up the downloaded json file and use `client_email` key for `GOOGLE_AUTH_SERVICE_EMAIL` and the `private_key` key for `GOOGLE_AUTH_SERVICE_KEY`.

5. TODO: Add instructions for setting up the service account with the necessary Google Group API roles in the Google Admin Console

The application should now have access to your Google Groups!

### Application Settings

The following table shows the various configuration options which can be set and their default values. These settings are changed in the `local.settings.json` file or in the function app's configuration settings if deployed to Azure.

_Note: The settings in bold are required. Refer to their corresponding configuration section on how to retrieve them_

| Name                              | Type    | Default        | Description                                                                                                                                 |
| --------------------------------- | ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SYNC_SCHEDULE                     | String  | 0 0 0 \* \* \* | Determines the frequency of sync operations using an [NCronTab](https://github.com/atifaziz/NCrontab) expression. Defaults to 12AM everyday |
| SYNC_SCHEDULE_ENABLED             | Boolean | true           | Set to true if the sync schedule should be used, false if otherwise. If false, sync operations must be started manually                     |
| SYNC_STUDENTS                     | Boolean | true           | Set to true if students should be synced to Google Groups, false if otherwise                                                               |
| SYNC_PARENTS                      | Boolean | true           | Set to true if parents should be synced to Google Groups, false if otherwise                                                                |
| SYNC_STUDENT_EMAILS               | Boolean | false          | Set to true if students emails in Blackbaud should be updated to reflect their email address found in Google                                |
| **BLACKBAUD_OAUTH_ID**            | String  |                | The application ID (OAuth client_id) of your Blackbaud SKY API application                                                                  |
| **BLACKBAUD_OAUTH_SECRET**        | String  |                | The primary application secret (OAuth client_secret) of your Blackbaud SKY API application                                                  |
| **BLACKBAUD_SUBSCRIPTION_KEY**    | String  |                | The primary access key of your Blackbaud SKY API subscription                                                                               |
| BLACKBAUD_STUDENT_ROLE            | String  | Student        | The Blackbaud role used when searching for students to sync to Google Groups                                                                |
| BLACKBAUD_PARENT_ROLE             | String  | Parent         | The Blackbaud role used when searching for parents to sync to Google Groups                                                                 |
| **GOOGLE_DOMAIN**                 | String  |                | The FQDN of your Google Workspace organization                                                                                              |
| GOOGLE_STUDENT_GROUP_EMAIL_PREFIX | String  | students       | The prefix of the email address used when creating missing student Google Groups                                                            |
| GOOGLE_STUDENT_GROUP_NAME         | String  | Class of       | The name to use when creating missing student Google Groups. _Note: The graduation year is automatically added to the end of this string_   |
| GOOGLE_PARENT_GROUP_EMAIL_PREFIX  | String  | parents        | The prefix of the email address used when creating missing parent Google Groups                                                             |
| GOOGLE_PARENT_GROUP_NAME          | String  | Parents of     | The name to use when creating missing parent Google Groups. _Note: The graduation year is automatically added to the end of this string_    |
| **GOOGLE_AUTH_SERVICE_EMAIL**     | String  |                | The email address of the Google Cloud Console service account to use                                                                        |
| **GOOGLE_AUTH_SERVICE_KEY**       | String  |                | The service key of the Google Cloud Console service account to use                                                                          |

_Note: The default permissions for created Google Groups can be modified in `src/environment.ts` -> `studentGroupPermissions` and `parentGroupPermissions` respectively. Refer to the table [here](https://developers.google.com/admin-sdk/groups-settings/v1/reference/groups#resource) on acceptable values_

## Usage

To start the application locally simply run:

```bash
npm run build

npm run local
```

This will start a local web server at `http://localhost:7071`.

### Setup

Before the application can fully work, a Blackbaud account must linked. Since this account will be used by the SKY API, it's recommended that you setup a new user specifically for this application. Whichever user you choose (existing or new), make sure it has the following roles:

- SKY API Basic
- SKY API Data Sync
- Any Manager Role
- Platform Manager
- Page Manager
- Content Editor (possibly Content Manager)

Afterwards, visit `http://localhost:7071/setup` to go through the setup process of linking your Blackbaud user to the application.

Once complete, BG Group Sync is ready to go! To start a sync job, you can either invoke it manually or if schedules are enabled, wait for the schedule to trigger the job.

### Manual Sync Job

To manually start a sync job, simply visit: `http://localhost:7071/sync`

### Sync Schedules

With sync schedules, you can have sync jobs run automatically without any user input. To enable it, simply set `SYNC_SCHEDULE_ENABLED` to `true` in the application's settings. The scheduling is controlled via the `SYNC_SCHEDULE` setting with [NCrontab](https://github.com/atifaziz/NCrontab) formatted strings. A few example situations are shown below:

**NCrontab Format:**

```
* * * * *
- - - - -
| | | | |
| | | | +----- day of week (0 - 6) (Sunday=0)
| | | +------- month (1 - 12)
| | +--------- day of month (1 - 31)
| +----------- hour (0 - 23)
+------------- min (0 - 59)
```

**Examples:**

| Occurance                     | NCrontab       |
| ----------------------------- | -------------- |
| Every 6 hours                 | 0 _/6 _ \* \*  |
| 12AM every day                | 0 0 0 \* \* \* |
| 1AM every Sunday              | 0 1 \* \* 0    |
| 2AM every 2 days              | 0 2 _/2 _ \*   |
| 2AM on the 1st of every month | 0 2 1 \* \*    |

_Note: For more examples, refer to [crontab guru](https://crontab.guru/)_

## Deployment to Azure

[![Deploy To Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fgithub.com%2Fbootsie123%2Fbg-group-sync%2Fblob%2Fmain%2Fazuredeploy.bicep)

To deploy the application to Azure, simply click on the link above and fill out the parameters in the deployment template. By default the location for all resources is based on the choosen `Region`. However, this can be changed by using the `Location` and `App Insights Location` options.

## Contributing

Pull requests are welcome. Any changes are appreciated!

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
