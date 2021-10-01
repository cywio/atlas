import ssh from '../../../lib/server/ssh'
import log from '../../../lib/server/log'
import prisma from '../../../lib/server/db'
import getSession from '../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id: accountId, admin } = await getSession(req, res)

		if (req.method === 'GET') {
			let database = await prisma.databases.findMany({
				...(!admin && { where: { owner: accountId } }),
			})
			res.json(database)
		} else if (req.method === 'POST') {
			let { name, description, type, version } = req.body

			if (!name || !type) return res.status(400).send()

			if (
				![
					'mysql',
					'postgres',
					'mariadb',
					'mongo',
					'redis',
					'memcached',
					'rabbitmq',
					'couchdb',
					'rethinkdb',
					'elasticsearch',
					'clickhouse',
				].includes(type)
			)
				return res.status(422).send()

			type = String(type).toLowerCase()

			if (!version) version = 'latest'

			let database = await prisma.databases.create({
				data: {
					name,
					type,
					version,
					description,
					status: 'PROVISIONING',
					accounts: {
						connect: {
							id: accountId,
						},
					},
				},
			})

			await log(req, accountId, `New ${type} database created: ${name}`)

			res.status(201).json(database)

			await ssh(`dokku ${type}:create ${database.id} -I ${version}`)

			await log(req, accountId, `Database ${name} is now ready for use`)

			/**
			 * Bug: Fails whenever an issue arises
			 */
			let dsn = await ssh(`dokku ${type}:info ${database.id}`)
			dsn = String(dsn)
				.split('\n')
				.find((i) => i.includes('Dsn:'))
				.split('Dsn:')[1]
				.trim()

			await prisma.databases.update({
				where: { id: database.id },
				data: {
					dsn,
					status: 'READY',
				},
			})
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
