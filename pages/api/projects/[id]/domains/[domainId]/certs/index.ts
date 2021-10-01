import ssh from '../../../../../../../lib/server/ssh'
import log from '../../../../../../../lib/server/log'
import prisma from '../../../../../../../lib/server/db'
import getSession from '../../../../../../../lib/server/session'

export default async function (req, res) {
	try {
		let { id, domainId } = req.query
		let { id: accountId, admin } = await getSession(req, res)

		let project = await prisma.projects.findUnique({
			where: { id },
			include: { accounts: true },
		})

		let domain = await prisma.domains.findFirst({
			where: { project: project.id, id: domainId },
		})

		if (!project || !domain) return res.status(404).send()
		if (!admin && project.owner !== accountId) return res.status(403).send()

		if (req.method === 'GET') {
			let certs = await prisma.certs.findMany({
				where: { project: project.id, domain: domainId },
			})
			res.json(certs)
		} else if (req.method === 'POST') {
			let { email } = req.body

			if (!email) return res.status(400).send()

			let cert = await prisma.certs.create({
				data: {
					common_names: domain.domain,
					status: 'REQUESTING',
					domains: {
						connect: {
							id: domainId,
						},
					},
					projects: {
						connect: {
							id: project.id,
						},
					},
					accounts: {
						connect: {
							id: accountId,
						},
					},
				},
			})

			res.status(202).json(cert)

			let client: any = await ssh('', [], true)

			await log(req, accountId, `Certificate request for ${domain.domain} was created on project ${project.name}`)

			await ssh('dokku', ['config:set', '--no-restart', project.id, `DOKKU_LETSENCRYPT_SERVER=staging`])
			await ssh('dokku', ['config:set', '--no-restart', project.id, `DOKKU_LETSENCRYPT_EMAIL=${email}`])

			client
				.exec('dokku', ['letsencrypt:enable', project.id], {
					onStdout: async (chunk) => {
						await appendToLogs(cert.id, chunk)
					},
					onStderr: async (chunk) => {
						await appendToLogs(cert.id, chunk)
					},
				})
				.then(async () => {
					await updateCompleteStatus(cert.id)
				})
				.catch(async () => {
					await updateCompleteStatus(cert.id)
				})

			await log(req, accountId, `Certificate issued for ${domain.domain} on project ${project.name}`)
		} else {
			res.status(405).send()
		}
	} catch (e) {
		console.log(e)
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}

async function appendToLogs(id, chunk) {
	let { logs } = await prisma.certs.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	console.log('Running appendlogs', logs)
	await prisma.certs.update({
		where: { id: id },
		data: {
			logs: `${logs}\n${chunk.toString('utf8')}`,
			status: 'REQUESTING',
		},
	})
}

async function updateCompleteStatus(id) {
	let { logs } = await prisma.certs.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	console.log('Running updatecompletestatus', logs)
	await prisma.certs.update({
		where: { id: id },
		data: {
			status: logs.includes('Server responded with a certificate') ? 'ISSUED' : 'FAILED',
		},
	})
}
