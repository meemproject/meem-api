import coreExpress, { Express } from 'express'
import fs from 'fs-extra'

export default (app: Express, express: typeof coreExpress) => {
	const router = express.Router()

	app.use('/api/1.0/', router)

	router.use('/types', async (req, res) => {
		const { allTypesPath } = services.types.getSharedTypesPaths()
		const sharedTypes = await fs.readFile(allTypesPath)
		return res.json({ types: sharedTypes.toString() })
	})
}
