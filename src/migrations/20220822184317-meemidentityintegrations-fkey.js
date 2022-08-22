import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemIdentityIntegrations" ADD CONSTRAINT "MeemIdentityIntegrations_MeemIdentityId_fkey" FOREIGN KEY ("MeemIdentityId") REFERENCES "MeemIdentities" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemIdentityIntegrations" ADD CONSTRAINT "MeemIdentityIntegrations_IdentityIntegrationId_fkey" FOREIGN KEY ("IdentityIntegrationId") REFERENCES "IdentityIntegrations" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
