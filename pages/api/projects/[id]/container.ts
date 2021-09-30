import ssh from '../../../../lib/server/ssh'
import log from '../../../../lib/server/log'
import prisma from '../../../../lib/server/db'
import getSession from '../../../../lib/server/session'

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
