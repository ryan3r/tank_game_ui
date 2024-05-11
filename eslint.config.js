import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
       rules: {
           "no-unused-vars": "warn",
           "no-undef": "warn",
       },
        languageOptions: {
            globals: {
                // Mocha
                describe: "readonly",
                it: "readonly",
                xit: "readonly",
                // Timers
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
            }
        }
    }
];
