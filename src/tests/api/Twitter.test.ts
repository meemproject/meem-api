import { assert } from 'chai'
import BaseTest from '../BaseTest'

class TwitterTests extends BaseTest {
	protected async setup() {
		it('Can split thread', () => this.splitThread())
		it('Can handle non-split thread', () => this.nonSplitThread())
	}

	private async splitThread() {
		const str =
			'Molestias corrupti qui ut ipsam quibusdam fugiat modi. Aut ut nisi ex incidunt velit tempore assumenda veniam. Velit ut commodi dignissimos quia. Ea animi molestiae pariatur id recusandae consequatur inventore quam tempora.\n\nExpedita est aperiam praesentium. Mollitia accusamus voluptatem aut molestiae. Reiciendis est quod soluta accusamus optio sit beatae saepe.\n\nReiciendis doloribus vel temporibus error. Repellendus exercitationem reprehenderit. Sunt totam repudiandae deleniti repellendus nostrum molestiae maiores dolore exercitationem. Dolorem id aut eaque optio iste. Ratione expedita ullam debitis exercitationem veritatis blanditiis aut assumenda recusandae. Nesciunt sequi voluptatibus nostrum maxime rerum ducimus et molestias.'
		const chunks = services.twitter.splitIntoThreadedChunks(str)

		assert.equal(chunks.length, 4)
		chunks.forEach(chunk => {
			assert.isTrue(/^\d\/ \w/.test(chunk))
			assert.isTrue(/\.$/.test(chunk))
		})
	}

	private async nonSplitThread() {
		const str =
			'Molestias corrupti qui ut ipsam quibusdam fugiat modi. Aut ut nisi ex incidunt velit tempore assumenda veniam. Velit ut commodi dignissimos quia.'
		const chunks = services.twitter.splitIntoThreadedChunks(str)

		assert.equal(chunks.length, 1)
		assert.equal(chunks[0], str)
	}
}

describe('TwitterTests', function tests() {
	new TwitterTests(this)
})
