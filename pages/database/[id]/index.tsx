import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Nav, DatabaseSidebar } from '@components'
import { useApi, useValidSession } from '@hooks'
import {dateFormat} from '@utils'

export default function Project() {
	const [database, setDatabase] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setDatabase(await useApi(`/api/databases/${id}`))
		}
		hydrate()
	}, [id])

	if (!database) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<DatabaseSidebar
					id={database.id}
					title={database.name}
					subtitle={`${database.type} ${database.version}`}
					active='overview'
				/>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='flex items-center gap-4 mb-8'>
						<img src={`/icons/${database.type}.svg`} className='w-10 h-10' />
						<span>
							<b>{database.name}</b>
							<p className='opacity-40'>Created {dateFormat(database.created)}</p>
						</span>
					</div>
					<div className='mb-8'>
						{database.description ? <p>{database.description}</p> : <p className='opacity-40'>No description provided</p>}
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Info</b>
						</div>
						<div className='flex flex-col gap-2 w-64'>
							<div className='flex flex-col gap-2 w-64'>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Name</p>
									<p>{database.name}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Created</p>
									<p>{dateFormat(database.created)}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Type</p>
									<p className='capitalize'>{database.type || <span className='opacity-40'>Unknown</span>}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Version</p>
									<p className='capitalize'>{database.version || <span className='opacity-40'>Unknown</span>}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Database ID</p>
									<p className='font-mono'>{database.id}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Status</p>
									<p>
										<Status status={database.status} />
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Connection</b>
						</div>
						<div className='flex flex-col gap-2 w-64'>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Username</p>
								<p className='blur-sm hover:blur-none transition'>{database.connection.user}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Password</p>
								<p className='blur-sm hover:blur-none transition'>{database.connection.password}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Port</p>
								<p className='blur-sm hover:blur-none transition'>{database.is_exposed ? database.port : 'Not Exposed'}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Database</p>
								<p className='blur-sm hover:blur-none transition'>{database.connection.database}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>DSN</p>
								<p className='blur-sm hover:blur-none transition'>{database.dsn}</p>
							</div>
							<div className='grid grid-cols-2'>
								<p className='opacity-40'>Status</p>
								<p>
									<Status status={database.port ? 'EXPOSED' : 'UNEXPOSED'} />
								</p>
							</div>
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
