import { QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.sequelize.query(
			'ALTER TABLE "Meems" ADD CONSTRAINT "Meems_MeemContractId_fkey" FOREIGN KEY ("MeemContractId") REFERENCES "MeemContracts" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
