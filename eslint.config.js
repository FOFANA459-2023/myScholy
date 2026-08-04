import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      // Vite uses the automatic JSX runtime, so a `React` import is only
      // needed for the API (memo, lazy, forwardRef) and must not be flagged.
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^React$", argsIgnorePattern: "^_" },
      ],

      // This is a plain JavaScript codebase - prop-types are not used, and
      // adding them to every internal component would be noise.
      "react/prop-types": "off",

      "react/jsx-no-target-blank": ["error", { allowReferrer: false }],

      // React 19 added camelCase `fetchPriority`; on React 18 only the
      // lowercase DOM attribute reaches the element without a console warning.
      // Drop this once the project moves to React 19.
      "react/no-unknown-property": ["error", { ignore: ["fetchpriority"] }],

      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  // Tooling configs and the Playwright suite run under Node, not the browser.
  {
    files: ["*.config.js", "e2e/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
