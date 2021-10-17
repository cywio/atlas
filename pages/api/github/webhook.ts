import log from '@server/log'
import prisma from '@server/db'
import github from '@server/github'
import build from '@server/build'
import moment from 'moment'

function allowDeployment(lastDeployment: Date) {
    const now = moment(new Date());
    const then = moment(lastDeployment);
    const diff = now.diff(then, 'minutes');
    return (diff > 5);
}

export default async function (req, res) {
	try {
		if (req.method === 'POST') {
			let event_type = req.headers['x-github-event']
			if (!event_type) res.status(400).send()

			if (event_type === 'push') {
				let { ref, after, repository, head_commit } = req.body

				let id = repository.id
				let branch = ref.split('refs/heads/')[1]

				let project = await prisma.projects.findFirst({
					where: {
						origin: `github:${id}:${branch}`,
					},
					include: {
						accounts: {
							select: {
								id: true,
								tokens: true,
							},
						},
						deployments: {
							take: 1,
							orderBy: {
								created: 'desc',
							}
						}
					},
				})

				if (!project) return res.status(404).send()

				let lastDeployment = project?.deployments?.pop();

				if(!lastDeployment || !allowDeployment(lastDeployment.created))
					return res.status(400).send();

				let { access_token } = await github(req, res, project.accounts.id)

				let commit = after
				let origin = `https://${access_token}@github.com/${repository.full_name}`
				let message = head_commit.message

				let deployment = await prisma.deployments.create({
					data: {
						branch,
						origin,
						commit,
						message,
						type: 'github',
						status: 'BUILDING',
						manual: false,
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

				await log(
					req,
					project.accounts.id,
					`Deployment for ${project.name} was triggered on branch ${branch} by Github commit ${commit}`
				)

				res.status(202).json(deployment)

				await build(project.id, deployment.id, origin, branch)
			} else {
				res.status(400).send()
			}
		} else {
			return res.status(405).send()
		}
	} catch (e) {
		if (typeof e == 'undefined') return e
		res.status(500).send()
	}
}
