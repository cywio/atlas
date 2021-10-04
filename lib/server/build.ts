import ssh from 'lib/server/ssh'
import prisma from 'lib/server/db'

export default async function (projectId, deploymentId, origin, branch) {
	try {
		let client: any = await ssh('', [], true)
		client
			.exec('dokku', ['git:sync', projectId, origin, branch, '--build'], {
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
	} catch (e) {}
}

async function appendToLogs(deploymentId, projectId, chunk) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: deploymentId },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: deploymentId },
		data: {
			logs: `${logs}\n${chunk.toString('utf8')}`,
			status: logs !== null ? (logs.includes(`Deploying ${projectId}...`) ? 'DEPLOYING' : 'BUILDING') : 'BUILDING',
		},
	})
}

async function updateCompleteStatus(id) {
	let { logs } = await prisma.deployments.findUnique({
		where: { id: id },
		select: { logs: true },
	})
	await prisma.deployments.update({
		where: { id: id },
		data: {
			status: logs.includes('Application deployed:') ? 'COMPLETED' : 'FAILED',
		},
	})
}
