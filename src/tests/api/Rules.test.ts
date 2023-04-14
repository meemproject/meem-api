import { assert } from 'chai'
import BaseTest from '../BaseTest'
import emoji from './emoji.json'

class RuleTests extends BaseTest {
	protected async setup() {
		it('Can properly count emoji', () => this.countEmoji())
	}

	private async countEmoji() {}
}

describe('RuleTests', function tests() {
	new RuleTests(this)
})
