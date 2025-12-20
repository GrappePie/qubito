import eslintConfigNext from "eslint-config-next";

const config = [
  ...eslintConfigNext,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
