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

/**
 * Generates an account email address using a specified first name, last name, domain, and year.
 * @example
 * // returns josm23@domain.com
 * genAccountEmail("john", "smith", "domain.com", "2023");
 * @param firstName The first name of the user
 * @param lastName The last name of the user
 * @param domain The domain name of the email address
 * @param year The year of the email address (gets shortened to the last two digits)
 * @param modifier An optional string which gets inserted before the '@' symbol
 * @returns An email address in the specified format
 */
export function genAccountEmail(
  firstName: string,
  lastName: string,
  domain: string,
  year: string,
  modifier = ""
) {
  return (
    firstName.substring(0, 2).toLowerCase() +
    lastName.substring(0, 2).toLowerCase() +
    year.substring(year.length - 2) +
    modifier +
    "@" +
    domain
  );
}
