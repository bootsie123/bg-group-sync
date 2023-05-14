/**
 * Generates a group email address using a specified prefix, domain, and year.
 * @example
 * // returns prefix23@domain.com
 * genGroupEmail("prefix", "domain.com", "2023");
 * @param prefix The prefix of the email address
 * @param domain The domain name of the email address
 * @param year The year of the email address (gets shortened to the last two digits)
 * @returns An email address in the specified format
 */
export function genGroupEmail(prefix: string, domain: string, year: string) {
  return prefix + year.substring(year.length - 2) + "@" + domain;
}
