import coreExpress, { Express } from 'express'

// Serve static assets from public/ directory
export default (app: Express, express: typeof coreExpress) => {
	app.use(
		['/public', /\/\d+\.\d+\.\d+\/public/],
		express.static(`${__dirname}/../../public`)
	)
}
