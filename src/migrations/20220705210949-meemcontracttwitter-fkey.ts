import { QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContractTwitters" ADD CONSTRAINT "MeemContractTwitters_MeemContractId_fkey" FOREIGN KEY ("MeemContractId") REFERENCES "MeemContracts" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)

		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContractTwitters" ADD CONSTRAINT "MeemContractTwitters_TwitterId_fkey" FOREIGN KEY ("TwitterId") REFERENCES "Twitters" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
