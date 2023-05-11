export default {
  sanitizeEmail: email => {
    const newEmail = email.toLowerCase().replace(" ", "").split(/(@)/);

    newEmail[0] = newEmail[0].replace(".", "");

    return newEmail.join("");
  }
};
