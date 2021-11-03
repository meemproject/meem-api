module.exports = {
	extends: 'kengoldfarb',
	globals: {
		lthr: true,
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
	},
	rules: {
		"no-param-reassign": ["error", { "props": false }],
		"react/static-property-placement": 0
	}
}
