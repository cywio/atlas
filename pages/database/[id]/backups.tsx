import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button, Nav, Input, DatabaseSidebar } from '@components'
import { useApi, useValidSession } from '@hooks'
import * as timeago from 'timeago.js'
import toast from 'react-hot-toast'

export default function Project() {
	const [database, setDatabase] = useState<any>(null)
	const [form, setForm] = useState<any>({})
	const [loading, setLoading] = useState(false)

	const router = useRouter()
	let { id } = router.query

	const hydrate = async () => {
		if (id) setDatabase(await useApi(`/api/databases/${id}`))
	}

	useEffect(() => {
		hydrate()
	}, [id])

	async function createBackup() {
		setLoading(true)
		await toast.promise(useApi(`/api/databases/${database.id}/backups`, 'POST', form), {
			loading: 'Creating backup...',
			success: () => {
				hydrate()
				return 'Success'
			},
			error: () => {
				setLoading(true)
				return 'Error, please try again'
			},
		})
	}

	async function disableBackups() {
		await toast.promise(useApi(`/api/databases/${database.id}/backups`, 'DELETE'), {
			loading: 'Disabling backups...',
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
					active='backups'
				/>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='mb-8'>
						<div className='mb-4'>
							<h1>Backups</h1>
						</div>
						<div className='flex flex-col gap-2 w-64'>
							{database.backup !== null ? (
								<>
									<div className='flex flex-col gap-2 w-64 mb-8'>
										<div className='grid grid-cols-2'>
											<p className='opacity-40'>Status</p>
											<p>{database.backup !== null ? 'Enabled' : 'Disabled'}</p>
										</div>
										<div className='grid grid-cols-2'>
											<p className='opacity-40'>Initialized</p>
											<p>{timeago.format(database.backup && database.backup.initialized)}</p>
										</div>
										<div className='grid grid-cols-2'>
											<p className='opacity-40'>Encrypted</p>
											<p>{database.backup && database.backup.password ? 'Yes' : 'No'}</p>
										</div>
									</div>
									<div className='w-96 mb-4 flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<img src='/icons/aws.svg' className='w-6' />
											<p>s3/{database.backup && database.backup.bucket}</p>
										</div>
										<Button onClick={() => disableBackups()}>Disable Backups</Button>
									</div>
									<div className='w-96 mb-4'>
										<Input label='Cron Schedule' value={database.backup && database.backup.schedule} />
										<Button className='float-right w-20'>Save</Button>
									</div>
									<div className='w-96 mb-4'>
										<span>
											<b>Backup Now</b>
											<p>Trigger a full database dump to your s3 bucket right now by clicking the button below. </p>
										</span>
										<Button>Backup Now</Button>
									</div>
								</>
							) : (
								<>
									<div className='w-96 mb-4'>
										<p className='mb-8'>
											Database backups are important, use an s3 bucket to backup your database at specified times
											using cron.
										</p>
										<Input
											type='text'
											label='Cron Schedule'
											onChange={({ target }) => setForm({ ...form, schedule: target.value })}
										/>
										<Input
											type='text'
											label='AWS Access Key'
											onChange={({ target }) => setForm({ ...form, aws_access_key: target.value })}
										/>
										<Input
											type='text'
											label='AWS Secret Key'
											onChange={({ target }) => setForm({ ...form, aws_secret_key: target.value })}
										/>
										<Input
											type='text'
											label='S3 Bucket Name'
											onChange={({ target }) => setForm({ ...form, bucket: target.value })}
										/>
										<Input
											type='password'
											label='Password (Optional, but recommended)'
											onChange={({ target }) => setForm({ ...form, password: target.value })}
										/>
										<Button
											onClick={() => createBackup()}
											loading={loading}
											disabled={
												loading || !form.aws_secret_key || !form.aws_access_key || !form.bucket || !form.schedule
											}
											className='w-full'
										>
											Create Backup Schedule
										</Button>
									</div>
								</>
							)}
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
