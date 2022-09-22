import { QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContractRolePermissions" ADD CONSTRAINT "MeemContractRolePermissions_RolePermissionId_fkey" FOREIGN KEY ("RolePermissionId") REFERENCES "RolePermissions" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
