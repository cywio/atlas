import { buildQueue } from 'lib/server/queues'
import ssh from 'lib/server/ssh'
import prisma from 'lib/server/db'

export default async function (projectId, deploymentId, origin, branch) {
	await buildQueue.push({ projectId, deploymentId, origin, branch })
}

export async function builder(payload) {
	let { projectId, deploymentId, origin, branch } = payload

	try {
		/**
		 * @BUG Possible bug with SSH client, appends extra ' when it detects ://,
		 * leads to failing Dokku builds
		 * @TODO All logs don't get inserted into DB
		 */

		await ssh('dokku', ['git:unlock', projectId])
		await ssh('dokku', ['apps:unlock', projectId])

		let client: any = await ssh('dokku', [], true)
		await client
			.exec(`git:sync ${projectId} ${origin}`, [branch, '--build'], {
				onStdout: async (chunk) => {
					await appendToLogs(deploymentId, projectId, chunk)
				},
				onStderr: async (chunk) => {
					await appendToLogs(deploymentId, projectId, chunk)
				},
			})
			.then(async () => {
				await updateCompleteStatus(deploymentId)
			})
			.catch(async () => {
				await updateCompleteStatus(deploymentId)
			})

		await ssh('dokku', ['cleanup'])
	} catch (e) {
		console.log(e)
	}
}

async function appendToLogs(deploymentId, projectId, chunk) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: deploymentId },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: deploymentId },
		data: {
			logs: `${logs != null ? `${logs}\n` : ''}${chunk.toString('utf8')}`,
			status: getStatusViaLogs(logs, projectId),
		},
	})
}

function getStatusViaLogs(logs, projectId) {
	if (logs == null) return 'INITIALIZING'

	let deploymentStage = logs.includes(`Deploying ${projectId}`)
	let buildStage = logs.includes(`Building ${projectId}`)

	if (buildStage && !deploymentStage) return 'BUILDING'
	if (buildStage && deploymentStage) return 'DEPLOYING'

	return 'INITIALIZING'
}

async function updateCompleteStatus(id) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	if (!logs) return
	await prisma.deployments.update({
		where: { id: id },
		data: {
			status: String(logs).includes('Application deployed:') ? 'COMPLETED' : 'FAILED',
		},
	})
}
