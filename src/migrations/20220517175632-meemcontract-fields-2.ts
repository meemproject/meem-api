import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemContracts', 'name', {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		})

		await queryInterface.addColumn('MeemContracts', 'symbol', {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
