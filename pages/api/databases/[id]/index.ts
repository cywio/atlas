import ssh from '@server/ssh'
import prisma from '@server/db'
import getSession from '@server/session'
import log from '@server/log'
import DSNParser from 'dsn-parser'

export default async function (req, res) {
	try {
		let { id } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let database = await prisma.databases.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!database) return res.status(404).send()
		if (!admin && database.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			delete database.accounts.password
			delete database.accounts.otp_secret
			database['is_exposed'] = !!database.port
			database['backup'] = JSON.parse(database.backup)
			database['connection'] = new DSNParser(database.dsn).getParts()
			res.json(database)
		} else if (req.method === 'PATCH') {
			let database = await prisma.databases.update({ where: { id }, data: req.body })
			await log(req, accountId, `Database ${database.name} was updated`)
			res.json(database)
		} else if (req.method === 'DELETE') {
			await prisma.databases.delete({ where: { id } })
			await ssh(`dokku ${database.type}:destroy ${database.id}`, ['--force'])
			await log(req, accountId, `Database ${database.name} was destroyed`)
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
