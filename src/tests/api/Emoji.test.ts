import { assert } from 'chai'
import BaseTest from '../BaseTest'
import emoji from './emoji.json'

class EmojiTests extends BaseTest {
	protected async setup() {
		it('Can translate emoji from unicode', () => this.translateUnicode())
	}

	private async translateUnicode() {
		assert.isOk(services.rule.unicodeToEmoji('2709-fe0f'))
		Object.keys(emoji).forEach(category => {
			const categoryEmojis = (emoji as Record<string, any>)[category]
			categoryEmojis.forEach((e: Record<string, any>) => {
				const u = services.rule.unicodeToEmoji(e.u)
				assert.isOk(u)
				const emUnicode = services.rule.emojiToUnicode(u)
				if (!emUnicode) {
					throw new Error('Error translating emoji to unicode')
				}
				assert.isOk(emUnicode)
				const [baseCode] = e.u.split('-')
				assert.equal(parseInt(emUnicode, 16), parseInt(baseCode, 16))
			})
		})
	}
}

describe('EmojiTests', function tests() {
	new EmojiTests(this)
})
