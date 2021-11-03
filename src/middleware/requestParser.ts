import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { Express } from 'express'

export default (app: Express) => {
	app.use(bodyParser({ limit: '10mb' }))
	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())
	app.use(cookieParser())

	log.info('Initialized session, bodyParser, cookieParser')
}
