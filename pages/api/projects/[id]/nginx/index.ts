import ssh from '../../../../../lib/server/ssh'
import prisma from '../../../../../lib/server/db'
import getSession from '../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			let logs = await ssh('dokku', ['nginx:report', project.id])
			let parsed = String(logs)
				.split('\n')
				.map((i) => i.split(':'))
				.map((i) => i.map((c) => c.trim()))
				.map((i) => ({
					[i[0].replace(/\s/g, '_').toLowerCase()]: i[1],
				}))
				.reduce((a, b) => Object.assign(a, { [Object.keys(b)[0]]: b[Object.keys(b)[0]] }), {})
			res.json(parsed)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
