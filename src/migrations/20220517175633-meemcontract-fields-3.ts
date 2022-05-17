import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemContracts', 'DefaultPropertiesId', {
			type: DataTypes.UUID,
			allowNull: true
		})
		await queryInterface.addColumn(
			'MeemContracts',
			'DefaultChildPropertiesId',
			{
				type: DataTypes.UUID,
				allowNull: true
			}
		)

		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContracts" ADD CONSTRAINT "MeemContracts_DefaultPropertiesId_fkey" FOREIGN KEY ("DefaultPropertiesId") REFERENCES "MeemProperties" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)

		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContracts" ADD CONSTRAINT "MeemContracts_DefaultChildPropertiesId_fkey" FOREIGN KEY ("DefaultChildPropertiesId") REFERENCES "MeemProperties" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
