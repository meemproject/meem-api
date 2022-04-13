import coreExpress, { Express } from 'express'
import fs from 'fs-extra'

export default (app: Express, express: typeof coreExpress) => {
	const router = express.Router()

	app.use('/api/1.0/', router)

	router.use('/types', async (req, res) => {
		let typesPath = services.types.getPublicTypesPath().publicTypesPath
		if (req.query.allTypes && req.query.allTypes === 'true') {
			typesPath = services.types.getAllTypesPath().allTypesPath
		}
		const sharedTypes = await fs.readFile(typesPath)
		return res.json({ types: sharedTypes.toString() })
	})
}
