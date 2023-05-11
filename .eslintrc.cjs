module.exports = {
  env: {
    es2022: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsdoc/recommended-typescript",
    "google",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "jsdoc"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  rules: {
    "require-yield": 0,
    "valid-jsdoc": 0,
    "require-jsdoc": 0,
    "jsdoc/require-yields": 0
  },
  root: true
};
