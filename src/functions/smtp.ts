import * as df from "durable-functions";
import { InvocationContext } from "@azure/functions";
import * as nodemailer from "nodemailer";
import * as pug from "pug";
import * as mjml2html from "mjml";

import { Logger, Severity } from "../lib/Logger";
import environment from "../environment";

import { syncUsersResults } from "./orchestrators/syncUsers";

export const FUNCTION_NAME = "smtpSendJobReport";

const template = pug.compileFile(__dirname + "/../templates/jobReport.pug");

const transporter = nodemailer.createTransport({
  host: environment.smtp.host,
  port: environment.smtp.port,
  secure: environment.smtp.useTLS,
  auth: {
    user: environment.smtp.auth.username,
    pass: environment.smtp.auth.password
  }
});

/**
 * Sends a sync job report via SMTP using the given job results
 * @param jobResults The {@link syncUsersResults} object to use for the report
 * @param context The OrchestrationContext passed to the handler
 * @returns Info on the sent email if successful, otherwise an error is thrown
 */
export async function smtpSendJobReport(jobResults: syncUsersResults, context: InvocationContext) {
  const logger = new Logger(context, "SMTP");

  try {
    await transporter.verify();

    const date = new Date();
    const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const mjml = mjml2html(
      template({
        jobResults,
        date: dateString
      })
    );

    const success = await transporter.sendMail({
      from: environment.smtp.sendAsEmail,
      to: environment.smtp.toEmail,
      subject: "[BG Group Sync] Sync Report " + dateString,
      html: mjml.html
    });

    return success;
  } catch (err) {
    logger.log(Severity.Error, err, "\nInput Parameters:", jobResults);

    throw err;
  }
}

df.app.activity(FUNCTION_NAME, {
  extraInputs: [df.input.durableClient()],
  handler: smtpSendJobReport
});
