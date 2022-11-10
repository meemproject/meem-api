import { QueryInterface } from 'sequelize'
import { tryPromise } from './lib/utils'
export default {
	up: async (queryInterface: QueryInterface) => {
		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "UserIdentities" ADD CONSTRAINT "UserIdentities_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "UserIdentities" ADD CONSTRAINT "UserIdentities_IdentityIntegrationId_fkey" FOREIGN KEY ("IdentityIntegrationId") REFERENCES "IdentityIntegrations" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface) => {}
}
