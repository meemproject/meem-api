import { assert } from 'chai'
import BaseTest from '../BaseTest'

class RuleTests extends BaseTest {
	protected async setup() {
		it('Can properly count emoji', () => this.countEmoji())
	}

	private async countEmoji() {
		// TODO: Implement rule tests
		assert.isTrue(true)
	}
}

describe('RuleTests', function tests() {
	new RuleTests(this)
})
