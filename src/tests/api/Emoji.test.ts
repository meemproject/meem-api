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
			const categoryEmojis = emoji[category]
			categoryEmojis.forEach(e => {
				const u = services.rule.unicodeToEmoji(e.u)
				assert.isOk(u)
				const emUnicode = services.rule.emojiToUnicode(u)
				assert.isOk(emUnicode)
				const [baseCode] = e.u.split('-')
				assert.equal(parseInt(emUnicode, 16), parseInt(baseCode, 16))
				console.log({ u, emUnicode })
			})
		})
	}
}

describe('EmojiTests', function tests() {
	new EmojiTests(this)
})
