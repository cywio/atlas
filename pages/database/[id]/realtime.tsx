import { useState, useEffect } from 'react'
import { Status, Spinner, Nav, DatabaseSidebar } from '@components'
import { useApi, useValidSession, useInterval } from '@hooks'
import { useRouter } from 'next/router'

export default function Realtime() {
	const [database, setDatabase] = useState<any>(null)
	const [logs, setLogs] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setDatabase(await useApi(`/api/databases/${id}`))
			if (id) setLogs(await useApi(`/api/databases/${id}/logs`))
		}
		hydrate()
	}, [id])

	useInterval(async () => {
		if (id) setLogs(await useApi(`/api/databases/${id}/logs`))
	}, 10000)

	if (!database) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<DatabaseSidebar
					id={database.id}
					title={database.name}
					subtitle={`${database.type} ${database.version}`}
					active='realtime'
				/>
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='flex items-center justify-between mb-8'>
						<h1>Logs</h1>
						{logs && <Status status='LIVE' />}
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Database Log</b>
						</div>
						{logs ? (
							<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3'>
								<p className='font-mono whitespace-pre-wrap'>{logs}</p>
							</div>
						) : (
							<Spinner size={32} />
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
