module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "globals": {
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 9
    },
    "rules": {
        "indent": [
            "error",
            "tab",
            {
              "VariableDeclarator": { "var": 2, "let": 2, "const": 3 },
              "SwitchCase" : 1
            }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars" : ["warn"],
        "no-console" : ["error", { allow: ["warn", "error"] }],
        "no-unused-vars": [
          "error",
          { "vars": "all", "args": "none" }
        ],
        "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
        "valid-jsdoc": ["warn"]
    }
};
