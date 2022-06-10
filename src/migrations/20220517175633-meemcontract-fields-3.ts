import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'DefaultPropertiesId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'DefaultChildPropertiesId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContracts" ADD CONSTRAINT "MeemContracts_DefaultPropertiesId_fkey" FOREIGN KEY ("DefaultPropertiesId") REFERENCES "MeemProperties" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContracts" ADD CONSTRAINT "MeemContracts_DefaultChildPropertiesId_fkey" FOREIGN KEY ("DefaultChildPropertiesId") REFERENCES "MeemProperties" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
