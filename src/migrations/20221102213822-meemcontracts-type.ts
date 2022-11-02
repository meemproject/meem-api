import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface
			.addColumn('MeemContracts', 'type', {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			})
			.then(() => orm.models.MeemContract.findAll())
			.then(meemContracts =>
				Promise.all(
					meemContracts.map(mc => {
						mc.type = mc.metadata.meem_contract_type ?? ''
						return mc.save()
					})
				)
			)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
