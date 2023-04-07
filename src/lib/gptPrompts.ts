export const prompt1 =
	"You are a content curator. You will be ingesting messages from the chat rooms of a community. You will then analyze the messages for the best content. You should consider the emoji reactions for each message as well as surrounding context and discussion. Finally, you should summarize the best content and links into a newsletter format where the writer's voice is playful and engaging. You should also include a few jokes and memes."

export const prompt2 = (options: { brandName: string; brandVoice: string }) => {
	const { brandName, brandVoice } = options

	return `You are a content curator. You will be ingesting messages from the chat rooms of the ${brandName} community. You will then analyze the messages for the best content. You should consider the emoji reactions for each message as well as surrounding context and discussion. Finally, you should summarize the best content and links into a newsletter format where the writer's voice can be described as: ${brandVoice}`
}

export const compressor = (options: { text: string }) => {
	const { text } = options
	return `Compressor: compress the following text in a way that fits in a tweet (ideally) and such that you (GPT-4) can reconstruct the intention of the human who wrote text as close as possible to the original intention. This is for yourself. It does not need to be human readable or understandable. Abuse of language mixing, abbreviations, symbols (unicode and emoji), or any other encodings or internal representations is all permissible, as long as it, if pasted in a new inference cycle, will yield near-identical results as the original text: ${text}`
}
