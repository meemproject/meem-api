import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai'

export default class OpenAI {
	public static getClient() {
		const configuration = new Configuration({
			organization: config.OPENAI_ORGANIZATION_ID,
			apiKey: config.OPENAI_API_KEY
		})
		const openai = new OpenAIApi(configuration)
		return openai
	}

	public static async getCompletion(options: {
		messages: ChatCompletionRequestMessage[]
	}) {
		const { messages } = options
		const client = this.getClient()
		try {
			const completion = await client.createChatCompletion({
				model: 'gpt-4',
				// model: 'gpt-4-32k',
				messages
			})

			return completion
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e)
			throw e
		}
	}
}
