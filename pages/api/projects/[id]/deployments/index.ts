import ssh from '@server/ssh'
import log from '@server/log'
import prisma from '@server/db'
import getSession from '@server/session'
import build from '@server/build'
import github from '@server/github'
import axios from 'axios'

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
			let { take } = req.query

			let deployments = await prisma.deployments.findMany({
				where: {
					project: project.id,
				},
				include: {
					accounts: true,
					projects: true,
				},
				orderBy: {
					created: 'desc',
				},
				...(take && { take: +take }),
			})

			deployments.forEach((i) => {
				delete i.accounts.password
				delete i.accounts.otp_secret
			})

			res.json(deployments)
		} else if (req.method === 'POST') {
			let { origin, type, branch } = req.body
			if ((type === 'git' && !origin) || !type) return res.status(400).send()
			if (!['docker', 'git', 'github'].includes(type)) return res.status(422).send()
			if (type === 'git' && !branch) return res.status(400).send()

			let currentDeployments = await prisma.deployments.count({ where: { project: project.id, status: 'BUILDING' } })
			if (currentDeployments > 0) return res.status(409).send('Concurrent builds are not available')

			if (type === 'git') {
				let deployment = await prisma.deployments.create({
					data: {
						origin,
						type,
						branch,
						manual: true,
						status: 'BUILDING',
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

				await log(req, accountId, `Deployment for ${project.name} was triggered for branch ${branch}`)

				res.status(202).json(deployment)

				await build(project.id, deployment.id, origin, branch)
			} else if (type === 'github') {
				let { access_token } = await github(req, res, project.accounts.id)
				let [originType, repo_id, branch] = project.origin.split(':')

				let { data: repositories } = await axios.get(`https://api.github.com/user/repos`, {
					headers: {
						Authorization: `token ${access_token}`,
					},
				})

				if (!repositories) return res.status(404).send()

				let { full_name } = repositories.find((a) => a.id == repo_id)
				if (!full_name) return res.status(404).send()

				let {
					data: [latest_commit],
				} = await axios.get(`https://api.github.com/repos/${full_name}/commits?per_page=1`, {
					headers: {
						Authorization: `token ${access_token}`,
					},
				})

				let commit = latest_commit.sha
				let origin = `https://${access_token}@github.com/${full_name}`
				let message = latest_commit.commit.message

				let deployment = await prisma.deployments.create({
					data: {
						branch,
						origin: origin.replace(new RegExp(`${access_token}`, 'g'), '[REDACTED]'),
						commit,
						message,
						type: 'github',
						status: 'BUILDING',
						manual: true,
						projects: {
							connect: {
								id: project.id,
							},
						},
						accounts: {
							connect: {
								id: project.accounts.id,
							},
						},
					},
				})

				await log(req, accountId, `Deployment for ${project.name} was triggered for branch ${branch} via GitHub Repository`)

				res.status(202).json(deployment)

				await build(project.id, deployment.id, origin, branch)
			}
		} else {
			res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
