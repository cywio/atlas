import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'

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

		if (req.method === 'POST') {
			let { action } = req.body

			if (!action || !['start', 'stop', 'restart', 'rebuild'].includes(action)) return res.status(400).send()

			await log(req, accountId, `Project container for ${project.name} was ${action === 'rebuild' ? 'rebuilt' : `${action}ed`}`)

			res.status(202).send()

			await ssh('dokku', [`ps:${action}`, project.id])
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
