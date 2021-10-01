import prisma from '../../../../../../../lib/server/db'
import getSession from '../../../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { certId, domainId, id: projectId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id: projectId },
			include: { accounts: true },
		})

		let domain = await prisma.domains.findFirst({
			where: { project: projectId, id: domainId },
		})

		let cert = await prisma.certs.findFirst({
			where: { project: projectId, domain: domainId, id: certId },
		})

		if (!project || !domain || !cert) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			res.json(cert)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
