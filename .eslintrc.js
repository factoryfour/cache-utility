module.exports = {
	"extends": "airbnb-base",
	"plugins": [
		"import"
	],
	"rules": {
		"indent": ["error", "tab", {"SwitchCase": 1}],
		"no-console": ["error", { "allow": ["error"]}],
		"no-tabs": ["off"],
		"comma-dangle": ["off"],
		"import/extensions": ["off"],
		"import/no-unresolved": [2, {
			ignore: ['config']
		}],
		"import/no-extraneous-dependencies": "off",
		"comma-dangle": [1, "always-multiline"]
	},
	"globals": {
		"document": true,
		"config": true,
		"navigator": true,
		"VERSION": true,
		"window": true,
		"localStorage": true,
		"sessionStorage": true,
	},
	"settings": {
		"import/ignore": ["config"]
	},
	"env": {
		"jest": true,
	},
};
