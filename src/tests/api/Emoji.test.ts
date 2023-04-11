import { assert } from 'chai'
import BaseTest from '../BaseTest'

class EmojiTests extends BaseTest {
	protected async setup() {
		it('Can translate emoji from unicode', () => this.translateUnicode())
	}

	private async translateUnicode() {
		assert.isOk(services.rule.unicodeToEmoji('2709-fe0f'))
	}
}

describe('EmojiTests', function tests() {
	new EmojiTests(this)
})
