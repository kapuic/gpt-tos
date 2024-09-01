// @ts-check

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
// import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        // @ts-expect-error `dirname` does exist
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginUnicorn.configs["flat/recommended"],
  // importPlugin.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-namespace": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/no-null": "off",
    },
    // settings: {
    //   "import/resolver": {
    //     // You will also need to install and configure the TypeScript resolver
    //     // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
    //     typescript: true,
    //     node: true,
    //   },
    // },
  },
);
