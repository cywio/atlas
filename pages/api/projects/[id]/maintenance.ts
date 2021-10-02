import ssh from '../../../../lib/server/ssh'
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
			await ssh('dokku', [`maintenance:${project.maintenance ? 'off' : 'on'}`, project.id])
			await prisma.projects.update({
				data: { maintenance: !project.maintenance },
				where: { id: project.id },
			})
			res.status(204).send()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
