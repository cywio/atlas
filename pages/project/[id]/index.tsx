import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Nav, ProjectSidebar, DeploymentTable, Container } from '@components'
import { useApi, useValidSession } from '@hooks'
import * as timeago from 'timeago.js'

export default function Project() {
	const [project, setProject] = useState<any>(null)
	const [builds, setBuilds] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setBuilds(await useApi(`/api/projects/${id}/deployments`))
		}
		hydrate()
	}, [id])

	if (!project || !builds) return null

	return (
		<Container>
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
							<p className='opacity-40'>Created {timeago.format(project.created)}</p>
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
								<p className='opacity-40'>Created</p>
								<p>{timeago.format(project.created)}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Project ID</p>
								<p className='font-mono'>{project.id}</p>
							</div>
						</div>
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Latest Builds</b>
						</div>
						<DeploymentTable id={project.id} limit={5} />
					</div>
				</main>
			</div>
		</Container>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
