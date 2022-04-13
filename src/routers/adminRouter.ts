import coreExpress, { Express, Request, Response, NextFunction } from 'express'
import AdminController from '../controllers/AdminController'
import extendedRouter from '../core/router'

export default (app: Express, _express: typeof coreExpress) => {
	const router = extendedRouter()

	app.use('/admin/1.0/', router)

	router.use((req: Request, res: Response, next: NextFunction) => {
		if (req.query.k !== config.SERVER_ADMIN_KEY) {
			res.status(403).json({
				status: 'failure',
				code: 'NOT_AUTHORIZED'
			})

			return
		}

		next()
	})

	router.getAsync('/runMigrations', AdminController.runMigrations)
	router.getAsync('/runSync', AdminController.runSync)
	router.getAsync('/meemSync', AdminController.meemSync)
	router.getAsync('/meemSyncReactions', AdminController.meemSyncReactions)
	router.getAsync(
		'/syncDbMeemIdsToContract',
		AdminController.syncDbMeemIdsToContract
	)
	router.getAsync('/seedPrompts', AdminController.seedPrompts)
	router.getAsync('/seedClubs', AdminController.seedClubs)
	router.getAsync('/syncPins', AdminController.syncPins)
}
