import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.removeColumn('MeemContractRoles', 'isTokenTransferrable')
		)
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'RoleMeemContractId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)
		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContractRoles" ADD CONSTRAINT "MeemContractRoles_RoleMeemContractId_fkey" FOREIGN KEY ("RoleMeemContractId") REFERENCES "MeemContracts" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},
	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
