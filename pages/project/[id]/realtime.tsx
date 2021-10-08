import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Status, Spinner, Nav, ProjectSidebar, Nothing } from '@components'
import { useApi, useValidSession, useInterval } from '@hooks'
import ansi from 'ansi_up'

export default function Realtime() {
	const [project, setProject] = useState<any>(null)
	const [logs, setLogs] = useState<any>(null)
	const [nginxLogs, setNginxLogs] = useState<any>(null)
	const [stats, setStats] = useState<any>(null)

	const router = useRouter()
	let { id } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setLogs(ansiToHtml(await useApi(`/api/projects/${id}/logs`)))
			if (id) setNginxLogs(ansiToHtml(await useApi(`/api/projects/${id}/nginx/logs`)))
			if (id) setStats(await useApi(`/api/projects/${id}/stats`))
		}
		hydrate()
	}, [id])

	useInterval(async () => {
		if (id) setLogs(ansiToHtml(await useApi(`/api/projects/${id}/logs`)))
		if (id) setNginxLogs(ansiToHtml(await useApi(`/api/projects/${id}/nginx/logs`)))
		if (id) setStats(await useApi(`/api/projects/${id}/stats`))
	}, 10000)

	function ansiToHtml(logs) {
		let convert = new ansi()
		return convert.ansi_to_html(logs)
	}

	if (!project) return null

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active={null} />
			<div className='flex flex-col md:flex-row'>
				<ProjectSidebar id={project.id} title={project.name} active='realtime' />
				<main className='bg-white rounded-lg shadow w-full p-10'>
					<div className='flex items-center justify-between mb-8'>
						<h1>Realtime</h1>
						{logs && nginxLogs && <Status status='LIVE' />}
					</div>
					{logs === '' ? (
						<Nothing text='Project has not been deployed yet' />
					) : (
						<>
							<div className='mb-8'>
								<div className='mb-4'>
									<b>Container Stats</b>
								</div>
								<div className='w-96'>
									{stats ? (
										<>
											<div className='grid gap-2' style={{ gridTemplateColumns: '30% 70%' }}>
												<p className='opacity-40'>System CPU</p>
												<p className='font-mono'>{stats.cpu_system}</p>
												<p className='opacity-40'>CPU Usage</p>
												<p className='font-mono'>{stats.cpu}</p>
												<p className='opacity-40'>Memory Usage</p>
												<p className='font-mono'>
													{stats.memory.memory_percentage} ({stats.memory.memory_used} of{' '}
													{stats.memory.memory_limit})
												</p>
												<p className='opacity-40'>Network Ingress</p>
												<p className='font-mono'>{stats.network.in}</p>
												<p className='opacity-40'>Network Egress</p>
												<p className='font-mono'>{stats.network.out}</p>
												<p className='opacity-40'>Block I/O</p>
												<p className='font-mono'>
													{stats.block.in} / {stats.block.out}
												</p>
												<p className='opacity-40'>Container ID</p>
												<p className='font-mono'>{stats.container_id}</p>
												<p className='opacity-40'>Processes</p>
												<p className='font-mono'>{stats.pids}</p>
											</div>
										</>
									) : (
										<Spinner size={32} />
									)}
								</div>
							</div>
							<div className='mb-8'>
								<div className='mb-4'>
									<b>Project Log</b>
								</div>
								{logs ? (
									<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-start justify-between mb-3'>
										<div className='font-mono whitespace-pre-wrap text-sm' dangerouslySetInnerHTML={{ __html: logs }} />
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
									<div className='h-96 overflow-auto flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-start justify-between mb-3'>
										<div
											className='font-mono whitespace-pre-wrap text-sm'
											dangerouslySetInnerHTML={{ __html: nginxLogs }}
										/>
									</div>
								) : (
									<Spinner size={32} />
								)}
							</div>
						</>
					)}
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
