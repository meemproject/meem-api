module.exports = {
	extends: 'kengoldfarb',
	globals: {
		log: true,
		describe: true,
		before: true,
		beforeEach: true,
		afterEach: true,
		after: true,
		it: true,
		config: true,
		orm: true,
		Promise: true,
		configuration: true,
		config: true,
		orm: true
	},
	rules: {
		"no-param-reassign": ["error", { "props": false }],
		"react/static-property-placement": 0
	}
}
