import prisma from '@server/db'
import getSession from '@server/session'

export default async function (req, res) {
	try {
		let { deploymentId, id: projectId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let deployment = await prisma.deployments.findFirst({
			where: { id: deploymentId, project: projectId },
			include: { accounts: true },
		})

		if (!deployment) return res.status(404).send()
		if (!admin && deployment.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			deployment['buildpack'] =
				deployment.logs !== null
					? deployment.logs.includes('app detected')
						? deployment.logs
								.split('\n')
								.find((a) => a.includes(' app detected'))
								.split('----->')[1]
								.split(' app detected')[0]
								.trim()
						: deployment.logs.includes('from Dockerfile')
						? 'Dockerfile'
						: null
					: null
			delete deployment.accounts.password
			delete deployment.accounts.otp_secret
			delete deployment.logs
			res.json(deployment)
		} else if (req.method === 'DELETE') {
			let latestDeployment = await prisma.deployments.findFirst({
				where: { project: deployment.project },
				orderBy: { created: 'desc' },
			})

			if (latestDeployment.id === deployment.id) return res.status(409).send('Cannot delete production deployment')

			await prisma.deployments.delete({ where: { id: deployment.id } })

			res.status(204).end()
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
