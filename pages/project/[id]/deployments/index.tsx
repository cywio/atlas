import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Spinner, Nav, ProjectSidebar, DeploymentTable, Nothing, Container } from '@components'
import { useApi, useValidSession } from '@hooks'

export default function Project() {
	const [project, setProject] = useState<any>(null)
	const [deploymentCount, setDeploymentCount] = useState<any>(0)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
		}
		hydrate()
	}, [id])

	return (
		<Container>
			<Nav active={null} />
			{project ? (
				<div className='flex flex-col md:flex-row'>
					<ProjectSidebar id={project.id} title={project.name} active='deployments' />
					<main className='bg-white rounded-lg shadow w-full p-10'>
						<div className='mb-8'>
							<div className='mb-4'>
								<h1>
									Builds <span className='opacity-40'>{deploymentCount}</span>
								</h1>
							</div>
							{!deploymentCount && <Nothing text='This project has no deployments yet, click trigger deploy to start one.' />}
							<DeploymentTable setCount={(n) => setDeploymentCount(n)} id={project.id} />
						</div>
					</main>
				</div>
			) : (
				<div className='grid place-items-center'>
					<Spinner size={24} />
				</div>
			)}
		</Container>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
