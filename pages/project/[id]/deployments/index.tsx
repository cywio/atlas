import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Spinner, Nav, ProjectSidebar } from '@components'
import { useApi, useValidSession } from '@hooks'
import * as timeago from 'timeago.js'

export default function Project() {
	const [project, setProject] = useState<any>(null)
	const [deployments, setDeployments] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setDeployments(await useApi(`/api/projects/${id}/deployments`))
		}
		hydrate()
	}, [id])

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			{deployments ? (
				<div className='flex'>
					<ProjectSidebar id={project.id} title={project.name} active='deployments' />
					<main className='bg-white rounded-lg shadow w-full p-10'>
						<div className='mb-8'>
							<div className='mb-4'>
								<h1>
									Builds <span className='opacity-40'>{deployments.length}</span>
								</h1>
							</div>

							{deployments.map((i, k) => {
								return (
									<a href={`/project/${i.project}/deployments/${i.id}`}>
										<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3 hover:border-gray-400 transition'>
											<div className='flex flex-col max-w-lg truncate'>
												<span className='flex items-center gap-2'>
													<b>{i.message || `Deployment #${deployments.length - k}`}</b>
													{i.rollback && <img src='/icons/rollback.svg' className='w-4 opacity-40' />}
												</span>
												<p className='opacity-60'>Deploying from {i.type}</p>
											</div>
											<div className='flex flex-col gap-2 items-end text-right w-32'>
												<Status status={i.status} />
												<p className='opacity-60'>{timeago.format(i.created)}</p>
											</div>
										</div>
									</a>
								)
							})}
						</div>
					</main>
				</div>
			) : (
				<div className='grid place-items-center'>
					<Spinner size={24} />
				</div>
			)}
		</div>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
