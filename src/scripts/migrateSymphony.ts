/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import path from 'path'
import log from '@kengoldfarb/log'
import dotenv from 'dotenv'
import pg from 'pg'

function objToInsert(obj: Record<string, any>) {
	const keys = Object.keys(obj)
	const values = Object.values(obj)
	const keyString = keys.map(k => `"${k}"`).join(', ')
	const valueString = values
		.map(value => {
			if (value === null) {
				return 'null'
			} else if (value instanceof Date) {
				return `'${value.toISOString()}'`
			} else if (typeof value === 'object') {
				return `'${JSON.stringify(value)}'`
			}

			return `'${value.replace("'", '')}'`
		})
		.join(', ')
	return `(${keyString}) VALUES (${valueString})`
}

const run = async () => {
	const dotenvpath = path.join(process.cwd(), '.env')
	await dotenv.config({ path: dotenvpath })
	console.log('did dotenv')

	const client = new pg.Client(process.env.DATABASE_URL)
	const symClient = new pg.Client(process.env.SYMPHONY_DATABASE_URL)
	await client.connect()
	await symClient.connect()
	console.log('initialized clients')

	const agreementDiscords = await symClient.query(
		'SELECT * FROM "AgreementDiscords"'
	)
	const agreementSlacks = await symClient.query(
		'SELECT * FROM "AgreementSlacks"'
	)
	const agreementTwitters = await symClient.query(
		'SELECT * FROM "AgreementTwitters"'
	)
	const discords = await symClient.query('SELECT * FROM "Discords"')
	const messages = await symClient.query('SELECT * FROM "Messages"')
	const rules = await symClient.query('SELECT * FROM "Rules"')
	const slacks = await symClient.query('SELECT * FROM "Slacks"')
	const twitters = await symClient.query('SELECT * FROM "Twitters"')

	console.log('got result')

	const agreementDiscordInserts = agreementDiscords.rows.map(row => {
		const agreementId = row.agreementId
		delete row.agreementId
		return { ...row, AgreementId: agreementId }
	})

	const agreementSlackInserts = agreementSlacks.rows.map(row => {
		const agreementId = row.agreementId
		delete row.agreementId
		return { ...row, AgreementId: agreementId }
	})

	const agreementTwitterInserts = agreementTwitters.rows.map(row => {
		const agreementId = row.agreementId
		delete row.agreementId
		return { ...row, AgreementId: agreementId }
	})

	const discordInserts = discords.rows.map(row => {
		return { ...row }
	})

	const slackInserts = slacks.rows.map(row => {
		return { ...row }
	})

	const twitterInserts = twitters.rows.map(row => {
		return { ...row }
	})

	const ruleInserts = rules.rows.map(row => {
		const agreementId = row.agreementId
		delete row.agreementId
		return { ...row, AgreementId: agreementId }
	})

	const messageInserts = messages.rows.map(row => {
		const agreementId = row.agreementId
		delete row.agreementId
		return { ...row, AgreementId: agreementId }
	})

	for (let i = 0; i < discords.rows.length; i++) {
		await client.query(
			`INSERT INTO "Discords" ${objToInsert(discordInserts[i])}`
		)
	}

	for (let i = 0; i < slacks.rows.length; i++) {
		await client.query(`INSERT INTO "Slacks" ${objToInsert(slackInserts[i])}`)
	}

	for (let i = 0; i < twitters.rows.length; i++) {
		await client.query(
			`INSERT INTO "Twitters" ${objToInsert(twitterInserts[i])}`
		)
	}

	for (let i = 0; i < agreementDiscordInserts.length; i++) {
		await client.query(
			`INSERT INTO "AgreementDiscords" ${objToInsert(
				agreementDiscordInserts[i]
			)}`
		)
	}

	for (let i = 0; i < agreementSlackInserts.length; i++) {
		await client.query(
			`INSERT INTO "AgreementSlacks" ${objToInsert(agreementSlackInserts[i])}`
		)
	}

	for (let i = 0; i < agreementTwitterInserts.length; i++) {
		await client.query(
			`INSERT INTO "AgreementTwitters" ${objToInsert(
				agreementTwitterInserts[i]
			)}`
		)
	}

	for (let i = 0; i < ruleInserts.length; i++) {
		await client.query(`INSERT INTO "Rules" ${objToInsert(ruleInserts[i])}`)
	}

	for (let i = 0; i < messageInserts.length; i++) {
		await client.query(
			`INSERT INTO "Messages" ${objToInsert(messageInserts[i])}`
		)
	}

	log.info(`🎉🎉🎉  Migrated symphony data`)
}

run()
	.then(() => {
		log.info('All done!')
		process.exit(0)
	})
	.catch(e => {
		console.log(e)
	})
