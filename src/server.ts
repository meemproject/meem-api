import start from './core/start'

start()
	.then(() => {
		log.superInfo(`Server booted on port: ${config.PORT}`)
	})
	.catch(e => {
		// eslint-disable-next-line no-console
		console.log(e)
	})
