import { QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		const [rows] = await queryInterface.sequelize.query('SELECT * FROM "Rules"')
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i] as Record<string, any>
			const definition = row.definition
			if (
				definition.approverEmojis &&
				definition.approverEmojis.length > 0 &&
				typeof definition.approverEmojis[0] === 'string'
			) {
				definition.approverEmojis = definition.approverEmojis.map(
					(emoji: string) => ({
						id: emoji,
						name: emoji,
						type: 'unified',
						unified: emoji
					})
				)
			}
			if (
				definition.proposerEmojis &&
				definition.proposerEmojis.length > 0 &&
				typeof definition.proposerEmojis[0] === 'string'
			) {
				definition.proposerEmojis = definition.proposerEmojis.map(
					(emoji: string) => ({
						id: emoji,
						name: emoji,
						type: 'unified',
						unified: emoji
					})
				)
			}
			if (
				definition.editorEmojis &&
				definition.editorEmojis.length > 0 &&
				typeof definition.editorEmojis[0] === 'string'
			) {
				definition.editorEmojis = definition.editorEmojis.map(
					(emoji: string) => ({
						id: emoji,
						name: emoji,
						type: 'unified',
						unified: emoji
					})
				)
			}
			if (
				definition.vetoerEmojis &&
				definition.vetoerEmojis.length > 0 &&
				typeof definition.vetoerEmojis[0] === 'string'
			) {
				definition.vetoerEmojis = definition.vetoerEmojis.map(
					(emoji: string) => ({
						id: emoji,
						name: emoji,
						type: 'unified',
						unified: emoji
					})
				)
			}
			await queryInterface.sequelize.query(
				`UPDATE "Rules" SET definition = '${JSON.stringify(
					definition
				)}' WHERE id = '${row.id}'`
			)
			log.debug(row)
		}
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
