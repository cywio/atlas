import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Spinner, Nav, ProjectSidebar } from '@components'
import { useApi, useValidSession, useInterval } from '@hooks'

export default function Realtime() {
	const [project, setProject] = useState<any>(null)
	const [logs, setLogs] = useState<any>(null)
	const [nginxLogs, setNginxLogs] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setLogs(await useApi(`/api/projects/${id}/logs`))
			if (id) setNginxLogs(await useApi(`/api/projects/${id}/nginx/logs`))
		}
		hydrate()
	}, [id])

	useInterval(async () => {
		if (id) setLogs(await useApi(`/api/projects/${id}/logs`))
	}, 10000)

	useInterval(async () => {
		if (id) setNginxLogs(await useApi(`/api/projects/${id}/nginx/logs`))
	}, 10000)

	if (!project) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex'>
				<ProjectSidebar id={project.id} title={project.name} active='realtime' />
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='flex items-center justify-between mb-8'>
						<h1>Logs</h1>
						{logs && nginxLogs && <Status status='LIVE' />}
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Project Log</b>
						</div>
						{logs ? (
							<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3'>
								<p className='font-mono whitespace-pre-wrap'>{logs}</p>
							</div>
						) : (
							<Spinner size={32} />
						)}
					</div>
					<div className='mb-8'>
						<div className='mb-4'>
							<b>Access Log</b>
						</div>
						{nginxLogs ? (
							<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3'>
								<p className='font-mono whitespace-pre-wrap'>{nginxLogs}</p>
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
