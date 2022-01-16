import { buildQueue, buildLogsQueue } from 'lib/server/queues'
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
		 */

		await ssh('dokku', ['git:unlock', projectId])
		await ssh('dokku', ['apps:unlock', projectId])

		let client: any = await ssh('dokku', [], true)
		await client
			.exec(`git:sync ${projectId} ${origin}`, [branch, '--build'], {
				onStdout: async (chunk) => await buildLogsQueue.push({ deploymentId, projectId, chunk, type: 'stdout' }),
				onStderr: async (chunk) => await buildLogsQueue.push({ deploymentId, projectId, chunk, type: 'stderr' }),
			})
			.then(async () => await updateCompleteStatus(deploymentId))
			.catch(async () => await updateCompleteStatus(deploymentId))

		await ssh('dokku', ['cleanup'])
	} catch (e) {
		console.log(e)
	}
}

export async function appendToLogs({ deploymentId, projectId, chunk, type }) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: deploymentId },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: deploymentId },
		data: {
			logs: formatLogs(logs, chunk, type),
			status: getStatusViaLogs(logs, projectId),
		},
	})
}

function formatLogs(logs, chunk, type) {
	let prevLineExists = logs !== null && logs !== ''

	/**
	 * Remove all GitHub tokens
	 */
	logs = String(logs).replace(new RegExp(/(gh.?_.*)@/, 'g'), '')

	let text = chunk
		.toString('utf8')
		.split('\n')
		.filter((i) => i !== '')
	let timestamp = String(new Date().getTime())
	let formated = text.map((i) => `${type}:${timestamp}:${i}`)

	return `${prevLineExists ? `${logs}\n` : ''}${formated.join('\n')}`
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
