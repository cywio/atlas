import { buildQueue } from '@server/queues'
import getSession from '@server/session'
import prisma from '@server/db'
import log from '@server/log'
import ssh from '@server/ssh'

export default async function (req, res) {
	try {
		let { id, deploymentId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		if (!project) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'POST') {
			let currentContainers = await ssh('docker', ['ps', '--no-trunc', '--format', '{{.ID}}:{{.Command}}'])
			let [id] = String(currentContainers)
				.split('\n')
				.map((i) => i.split(':'))
				.filter((i) => /build/.test(String(i)))
				.flat()

			await ssh('docker', ['kill', id])

			await log(req, accountId, `Deployment ${deploymentId} was manually canceled`)

			res.status(202).end()

			let queue = buildQueue.getQueue()
			queue = queue.filter((i) => i.deploymentId !== deploymentId)
			buildQueue.killAndDrain()
			await Promise.all(queue.map((i) => buildQueue.push(i)))

			/**
			 * @TODO Figure out a better way to do this
			 */
			setTimeout(
				async () =>
					await prisma.deployments.update({
						where: { id: deploymentId },
						data: { status: 'CANCELED' },
					}),
				1000
			)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
