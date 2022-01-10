import { useState, useEffect } from 'react'
import { Status, Spinner, Nav, DatabaseSidebar, Container } from '@components'
import { useApi, useValidSession, useInterval } from '@hooks'
import { useRouter } from 'next/router'
import ansi from 'ansi_up'

export default function Realtime() {
	const [database, setDatabase] = useState<any>(null)
	const [logs, setLogs] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setDatabase(await useApi(`/api/databases/${id}`))
			if (id) setLogs(ansiToHtml(await useApi(`/api/databases/${id}/logs`)))
		}
		hydrate()
	}, [id])

	useInterval(async () => {
		if (id) setLogs(ansiToHtml(await useApi(`/api/databases/${id}/logs`)))
	}, 10000)

	function ansiToHtml(logs) {
		let convert = new ansi()
		return convert.ansi_to_html(logs)
	}

	if (!database) return null

	return (
		<Container>
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
							<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-start justify-between mb-3'>
								<div className='font-mono whitespace-pre-wrap text-sm' dangerouslySetInnerHTML={{ __html: logs }} />
							</div>
						) : (
							<Spinner size={32} />
						)}
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
