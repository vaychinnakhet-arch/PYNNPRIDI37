import html from "eslint-plugin-html";
import globals from "globals";
export default [
    {
        files: ["**/*.html"],
        plugins: { html },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
