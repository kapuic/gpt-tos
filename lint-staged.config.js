// @ts-check
/** @type {import("lint-staged").Config} */
export default {
  "**/*": ["bun lint:fix", "bun format"],
};
