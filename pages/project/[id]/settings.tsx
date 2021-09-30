import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Textarea, Input, Button, ProjectSidebar, Nav } from '@components'
import { useApi, useValidSession } from '@hooks'
import toast from 'react-hot-toast'

export default function Project() {
	const [project, setProject] = useState<any>({})

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
		}
		hydrate()
	}, [id])

	async function updateProject() {
		await toast.promise(
			useApi(`/api/projects/${id}`, 'PATCH', {
				name: project.name,
				description: project.description,
			}),
			{
				loading: 'Updating...',
				success: () => {
					return 'Updated'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function restartProject() {
		await toast.promise(useApi(`/api/projects/${id}/container`, 'POST', { action: 'restart' }), {
			loading: 'Please wait...',
			success: () => {
				return 'Action queued! Your container will restart.'
			},
			error: 'Error, please try again',
		})
	}

	async function shutdownProject() {
		await toast.promise(useApi(`/api/projects/${id}/container`, 'POST', { action: 'stop' }), {
			loading: 'Please wait...',
			success: () => {
				return 'Action queued! Your container will shutdown.'
			},
			error: 'Error, please try again',
		})
	}

	async function deleteProject() {
		await toast.promise(useApi(`/api/projects/${id}`, 'DELETE'), {
			loading: 'Deleting... (Do not reload this page, this may take a while)',
			success: () => {
				router.push('/')
				return 'Success'
			},
			error: 'Error, please try again',
		})
	}

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<ProjectSidebar id={project.id} active='settings' title={project.name} />
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8'>
						<b>Settings</b>
					</div>
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<Input
							label='Project Name'
							onChange={({ target }) => setProject({ ...project, name: target.value })}
							value={project.name}
						/>
						<Textarea
							label='Description (Optional)'
							onChange={({ target }) => setProject({ ...project, description: target.value })}
							value={project.description}
						/>
						<Input label='Project ID' value={project.id} disabled />
						<small className='opacity-40'>This is the ID that is used internally on your server</small>
						<Button onClick={() => updateProject()}>Save Changes</Button>
					</div>
					<div className='grid grid-rows-3'>
						<div className='w-96 mb-4'>
							<span>
								<b>Restart App</b>
								<p>Restart the container that is running your app. This may temporarily cause your website to go down.</p>
							</span>
							<Button onClick={() => restartProject()}>Restart</Button>
						</div>
						<div className='w-96 mb-4'>
							<span>
								<b>Shutdown App</b>
								<p>Shutdown the container that is running your app. This will cause requests to timeout.</p>
							</span>
							<Button onClick={() => shutdownProject()}>Shutdown</Button>
						</div>
						<div className='w-96 mb-4'>
							<span>
								<b>Delete App</b>
								<p>
									This will remove all deployments, certificates, domains and settings. All linked databases will remain
									intact but will be disconnected from this project.
								</p>
							</span>
							<Button className='text-red-600 border-red-600' onClick={() => deleteProject()}>
								Delete Project
							</Button>
						</div>
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
