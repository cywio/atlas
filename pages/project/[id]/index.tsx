import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Nav, ProjectSidebar, DeploymentTable } from '@components'
import { useApi, useValidSession } from '@hooks'
import {dateFormat} from '@utils'
import {CopyToClipboard} from 'react-copy-to-clipboard'

export default function Project({scheme, host}) {
	const baseUri = `${scheme}://${host}`;
	const [project, setProject] = useState<any>(null)
	const [builds, setBuilds] = useState<any>(null)
	const [deployments, setDeployments] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query
	let lastBulitBranch = deployments && deployments[0]?.branch;
	let lastOrigin = deployments && deployments[0]?.origin;
	let lastType = deployments && deployments[0]?.type;
	let weebHook = `${baseUri}/api/git/webhook?projectId=${id}`;
	let supportWebHook = lastType === "git";

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setBuilds(await useApi(`/api/projects/${id}/deployments`))
			if (id) setDeployments(await useApi(`/api/projects/${id}/deployments?take=1`))
		}
		hydrate()
	}, [id])

	if (!project || !builds) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex flex-col md:flex-row'>
				<ProjectSidebar id={project.id} title={project.name} active='overview' />
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='flex items-center gap-4 mb-8'>
						<img
							src={
								project.domains.length !== 0
									? `https://icons.duckduckgo.com/ip3/${project.domains[0].domain}.ico`
									: `/icons/earth.svg`
							}
							className={`w-10 h-10 ${!project.domains.length && 'opacity-20'}`}
						/>
						<span>
							<b>{project.name}</b>
							<p className='opacity-40'>Created {dateFormat(project.created)}</p>
						</span>
					</div>
					<div className='mb-8'>
						{project.description ? <p>{project.description}</p> : <p className='opacity-40'>No description provided</p>}
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Info</b>
						</div>
						<div className='flex flex-col gap-2 w-64'>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Status</p>
								<p>
									<Status status={builds.length && builds[0].status} />
								</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Type</p>
								<p className='capitalize'>{lastType}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Origin</p>
								<p className='font-mono'>{lastOrigin}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Branch</p>
								<p className='font-mono'>{lastBulitBranch || <span className='opacity-40'>Unknown</span>}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Project ID</p>
								<p className='font-mono'>{project.id}</p>
							</div>
							{
							supportWebHook ? 
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Webhook</p>
									<p className='font-mono'>{weebHook} 
										<a href="#" className="w-24 h-24"> 
											<CopyToClipboard text={weebHook}>
												<img src={'/icons/copy.svg'}></img>
											</CopyToClipboard>
										</a>
									</p>
								</div>
								:
								null
							}
						</div>
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Latest Builds</b>
						</div>
						<DeploymentTable id={project.id} limit={5}/>
					</div>
				</main>
			</div>
		</div>
	)
}

export async function getServerSideProps(context) {
	const {referer} = context.req.headers;
	const scheme = context.req.headers['x-forwarded-proto'] || (referer && referer.includes("https://") ? "https": "http");
	return {
		props: {
			scheme,
			host: context.req.headers['host'] || null,
		},
		...useValidSession(context),
	}
}
