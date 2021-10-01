import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Textarea, Input, Button, DatabaseSidebar, Nav, Status } from '@components'
import { useApi, useValidSession } from '@hooks'
import toast from 'react-hot-toast'

export default function Project() {
	const [database, setDatabase] = useState<any>(null)
	const [deleteConfirmation, setDeleteConfirmation] = useState<string>('')

	const router = useRouter()
	let { id } = router.query

	const hydrate = async () => {
		if (id) setDatabase(await useApi(`/api/databases/${id}`))
	}

	useEffect(() => {
		hydrate()
	}, [id])

	async function updateDatabase() {
		await toast.promise(
			useApi(`/api/databases/${id}`, 'PATCH', {
				name: database.name,
				description: database.description,
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

	async function deleteDatabase() {
		await toast.promise(useApi(`/api/databases/${id}`, 'DELETE'), {
			loading: 'Deleting... (Do not reload this page, this may take a while)',
			success: () => {
				router.push('/')
				return 'Success'
			},
			error: 'Error, please try again',
		})
	}

	async function exposeDatabase() {
		await toast.promise(useApi(`/api/databases/${id}/expose`, 'POST'), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return 'Success'
			},
			error: 'Error, please try again',
		})
	}

	async function unexposeDatabase() {
		await toast.promise(useApi(`/api/databases/${id}/expose`, 'DELETE'), {
			loading: 'Please wait...',
			success: () => {
				hydrate()
				return 'Success'
			},
			error: 'Error, please try again',
		})
	}

	if (!database) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<DatabaseSidebar
					id={database.id}
					title={database.name}
					subtitle={`${database.type} ${database.version}`}
					active='settings'
				/>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8'>
						<b>Settings</b>
					</div>
					<div className='flex flex-col gap-2 mb-12 w-96'>
						<Input
							label='Database Name'
							onChange={({ target }) => setDatabase({ ...database, name: target.value })}
							value={database.name}
						/>
						<Textarea
							label='Description (Optional)'
							onChange={({ target }) => setDatabase({ ...database, description: target.value })}
							value={database.description}
						/>
						<Input label='Database ID' value={database.id} disabled />
						<small className='opacity-40'>This is the ID that is used internally on your server</small>
						<Button onClick={() => updateDatabase()}>Save Changes</Button>
					</div>
					<div className='flex flex-col gap-4'>
						<div className='w-96 mb-4'>
							<span>
								<div className='flex items-center gap-3'>
									<b>Expose Database</b>
									<Status status={database.port ? 'EXPOSED' : 'UNEXPOSED'} />
								</div>
								<p>Expose your database to a random port so that you can access it from outside the host container.</p>
							</span>
							{database.port ? (
								<Button onClick={() => unexposeDatabase()}>Unxpose</Button>
							) : (
								<Button onClick={() => exposeDatabase()}>Expose</Button>
							)}
						</div>
						<div className='w-96 mb-4'>
							<span>
								<b>Delete Database</b>
								<p>
									This will unlink this database from all projects and destroy it's data, make sure you know what you are
									doing!
								</p>
							</span>
							<div className='mt-5'>
								<Input
									label={`Type 'Delete ${database.name} permanently'`}
									onChange={({ target }) => setDeleteConfirmation(target.value)}
									value={deleteConfirmation}
								/>
							</div>
							<Button
								className='text-red-600 border-red-600'
								disabled={deleteConfirmation.toLowerCase() !== `delete ${database.name} permanently`}
								onClick={() => deleteDatabase()}
							>
								Delete Database
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
