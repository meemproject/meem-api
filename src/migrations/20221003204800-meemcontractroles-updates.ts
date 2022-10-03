import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'isDefaultRole', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'name', {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'description', {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'imageUrl', {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
