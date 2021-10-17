import log from '@server/log'
import prisma from '@server/db'
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
			let {projectId, branch} = req.query;
			if (!projectId) res.status(400).send();

            let project = await prisma.projects.findFirst({
                where: {
                    id: projectId,
                },
                include: { 
                    accounts: true,
                    deployments: {
                        take: 1,
                        orderBy: {
                            created: 'desc',
                        }
                    }
                }
            });
            let lastDeployment = project?.deployments?.pop();

			if (project && lastDeployment) {
				let { ref, after, head_commit, commit, commits } = req.body;
                let { origin } = lastDeployment;

                if (!head_commit) head_commit = (commit||(commits && commits[0]));

				if( !branch ) branch = (lastDeployment?.branch || 'master');

				let commitedBranch = ref?.split('refs/heads/')[1];
                let message = head_commit?.message;

                if(lastDeployment?.type !== 'git' || !allowDeployment(lastDeployment.created) || (commitedBranch && branch !== commitedBranch)) {
                    return res.status(400).send();
                } else {
                    let deployment = await prisma.deployments.create({
                        data: {
                            branch,
                            origin,
                            commit: after,
                            message,
                            type: 'git',
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
                        `Deployment for ${project.name} was triggered on branch ${branch} by Git commit ${after}`
                    )

                    res.status(202).json(deployment)

                    await build(project.id, deployment.id, origin, branch)
                }
				
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
