import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Textarea, Input, Button, ProjectSidebar, Nav, Spinner, Select, Container } from '@components'
import { useApi, useValidSession } from '@hooks'
import toast from 'react-hot-toast'

export default function Project() {
	const [project, setProject] = useState<any>({})
	const [ghRepos, setGhRepos] = useState<any>(null)
	const [repo, setRepo] = useState<any>(null)

	const [selectRepo, setSelectRepo] = useState<string>('')
	const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')

	const router = useRouter()
	let { id } = router.query

	const hydrate = async () => {
		if (id) setProject(await useApi(`/api/projects/${id}`))
		if (id) setRepo(await useApi(`/api/projects/${id}/link/repo`))
	}

	useEffect(() => {
		hydrate()
	}, [id])

	useEffect(() => {
		const hydrate = async () => {
			if (repo && !repo.connected) setGhRepos(await useApi(`/api/github/repos`))
		}
		hydrate()
	}, [repo])

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

	async function connectRepo() {
		await toast.promise(
			useApi(`/api/projects/${id}/link/repo`, 'POST', {
				repo_id: selectRepo,
				/**
				 * @TODO Support different branch names
				 */
				branch: 'master',
				type: 'github',
			}),
			{
				loading: 'Please wait...',
				success: () => {
					setSelectRepo('')
					hydrate()
					return 'Connected'
				},
				error: 'Error, please try again',
			}
		)
	}

	async function disconnectRepo() {
		await toast.promise(useApi(`/api/projects/${id}/link/repo`, 'DELETE'), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return 'Disconnected'
			},
			error: 'Error, please try again',
		})
	}

	return (
		<Container>
			<Nav active={null} />
			<div className='flex flex-col md:flex-row'>
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
					<div className='flex flex-col gap-4'>
						<div className='w-96 mb-4'>
							<span>
								<div className='mb-3'>
									<b>Connected Repo</b>
								</div>
								{repo ? (
									<>
										{repo.connected ? (
											<>
												<p>
													{repo && repo.name} via <span className='capitalize'>{repo && repo.type}</span>
												</p>
												<Button onClick={() => disconnectRepo()}>Disconnect</Button>
											</>
										) : (
											<>
												<p>
													<Select onChange={({ target }) => setSelectRepo(target.value)}>
														<option selected disabled>
															Select one
														</option>
														{ghRepos &&
															ghRepos.map((i) => {
																return (
																	<option value={i.id}>
																		{i.name} {i.private ? '(Private)' : null} {i.fork ? '(Fork)' : null}
																	</option>
																)
															})}
													</Select>
												</p>
												<Button onClick={() => connectRepo()} disabled={!selectRepo}>
													Connect
												</Button>
											</>
										)}
									</>
								) : (
									<Spinner size={32} />
								)}
							</span>
						</div>
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
							<div className='mt-5'>
								<Input
									label={`Type 'Delete ${project.name} permanently'`}
									onChange={({ target }) => setDeleteConfirmation(target.value)}
									value={deleteConfirmation}
								/>
							</div>
							<Button
								className='text-red-600 border-red-600'
								disabled={deleteConfirmation.toLowerCase() !== `delete ${String(project.name).toLowerCase()} permanently`}
								onClick={() => deleteProject()}
							>
								Delete Project
							</Button>
						</div>
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
