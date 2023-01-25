import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('Extensions', 'category', {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: 'none'
			})
		)
		await tryPromise(
			queryInterface.addColumn('Extensions', 'capabilities', {
				type: DataTypes.JSONB,
				allowNull: false,
				defaultValue: []
			})
		)
		await tryPromise(
			queryInterface.addColumn('Extensions', 'isSetupRequired', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			})
		)
		await tryPromise(
			queryInterface.addColumn('AgreementExtensions', 'isSetupComplete', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
