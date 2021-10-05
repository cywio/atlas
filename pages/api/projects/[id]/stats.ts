import ssh from '@server/ssh'
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

		if (req.method === 'GET') {
			let container_id: any = await ssh('dokku', ['ps:report', project.id])
			if (
				container_id
					.split('\n')
					.find((i) => i.includes('Running:'))
					.split('Running: ')[1]
					.trim() == 'false'
			)
				return res.status(409).send()

			container_id = container_id.split('CID: ')[1].replace(/\)/g, '')
			if (!container_id) return res.status(409).send()

			let container_stats: any = await ssh('docker', ['stats', '--no-stream', container_id])
			let system_cpu: any = await ssh("ps -A -o %cpu | awk '{s+=$1} END {print s}'")

			container_stats =
				container_stats &&
				container_stats
					.split('\n')
					.map((i) => i.split('  '))
					.map((i) => i.filter((b) => b !== ''))
					.map((i) => i.map((m) => m.trim()))
					.map((i) => ({
						container_id: i[0],
						name: i[1],
						cpu: i[2],
						memory: {
							memory_used: i[3].split('/')[0].trim(),
							memory_limit: i[3].split('/')[1].trim(),
							memory_percentage: i[4],
						},
						network: {
							in: i[5].split('/')[0].trim(),
							out: i[5].split('/')[1].trim(),
						},
						block: {
							in: i[6].split('/')[0].trim(),
							out: i[6].split('/')[1].trim(),
						},
						pids: i[7],
					}))

			container_stats.shift()

			res.json({ cpu_system: `${system_cpu}%`, ...container_stats[0] })
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
