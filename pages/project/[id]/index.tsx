import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Spinner, Nav, ProjectSidebar } from '@components'
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
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
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
						{builds.length ? (
							builds.map((i) => {
								return (
									<a href={`${i.project}/deployments/${i.id}`}>
										<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3 hover:border-gray-400 transition'>
											<div className='flex flex-col max-w-lg truncate'>
												<b>{i.message}</b>
												<p className='opacity-60'>Deploying from {i.type}</p>
											</div>
											<div className='flex flex-col gap-2 items-end text-right w-32'>
												<Status status={i.status} />
												<p className='opacity-60'>{timeago.format(i.created)}</p>
											</div>
										</div>
									</a>
								)
							})
						) : (
							<Spinner size={24} />
						)}
					</div>
				</main>
			</div>
		</div>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
