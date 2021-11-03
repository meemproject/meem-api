import { Express } from 'express'

export default (app: Express) => {
	// For rate limiting while behind a proxy (on heroku)
	app.enable('trust proxy')
}
