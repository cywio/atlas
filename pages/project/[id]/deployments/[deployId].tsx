import { useState, useEffect } from 'react'
import { useInterval, useApi, useValidSession } from '@hooks'
import { Status, Nav, ProjectSidebar, Spinner, Button, Container, Dropdown } from '@components'
import { intervalToDuration, formatDuration, formatISO9075 } from 'date-fns'
import { useRouter } from 'next/router'
import * as timeago from 'timeago.js'
import toast from 'react-hot-toast'
import css from 'classnames'
import ansi from 'ansi_up'

export default function Deployments() {
	const [project, setProject] = useState<any>({})
	const [deployment, setDeployment] = useState<any>({})
	const [logs, setLogs] = useState<string>('')

	const router = useRouter()
	let { id, deployId } = router.query

	useEffect(() => {
		const hydrate = async () => {
			if (id) setProject(await useApi(`/api/projects/${id}`))
			if (id) setDeployment(await useApi(`/api/projects/${id}/deployments/${deployId}`))
			if (id) setLogs(await useApi(`/api/projects/${id}/deployments/${deployId}/logs`))
		}
		hydrate()
	}, [id, deployId])

	useInterval(
		async () => {
			if (id) setLogs(await useApi(`/api/projects/${id}/deployments/${deployId}/logs`))
		},
		deployment.status === 'QUEUED' ||
			deployment.status === 'INITIALIZING' ||
			deployment.status === 'BUILDING' ||
			deployment.status === 'DEPLOYING'
			? 1000
			: null
	)

	useInterval(
		async () => {
			if (id) setDeployment(await useApi(`/api/projects/${id}/deployments/${deployId}`))
		},
		deployment.status === 'QUEUED' ||
			deployment.status === 'INITIALIZING' ||
			deployment.status === 'BUILDING' ||
			deployment.status === 'DEPLOYING'
			? 3000
			: null
	)

	async function rollback() {
		await toast.promise(useApi(`/api/projects/${id}/deployments/${deployId}/rollback`, 'POST'), {
			loading: 'Redeploying...',
			success: ({ id: newDeploy }) => {
				router.push(`/project/${id}/deployments/${newDeploy}`)
				return 'Redeploy triggered'
			},
			error: 'Error, please try again',
		})
	}

	async function terminate() {
		await toast.promise(useApi(`/api/projects/${id}/deployments/${deployId}/terminate`, 'POST'), {
			loading: 'Terminating task...',
			success: () => {
				return 'Build was terminated'
			},
			error: 'Error, please try again',
		})
	}

	async function dequeue() {
		await toast.promise(useApi(`/api/projects/${id}/deployments/${deployId}/dequeue`, 'POST'), {
			loading: 'Removing from queue...',
			success: () => {
				return 'Removed from queue'
			},
			error: 'Error, please try again',
		})
	}

	async function deleteDeployment() {
		await toast.promise(useApi(`/api/projects/${id}/deployments/${deployId}`, 'DELETE'), {
			loading: 'Deleteing...',
			success: () => {
				window.location.href = `/project/${deployment.project}/deployments`
				return 'Deployment successfully deleted'
			},
			error: (e) => e.response.data,
		})
	}

	function parseToHtml(logs) {
		let convert = new ansi()
		logs = convert.ansi_to_html(logs)

		logs = logs.replace(
			/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi,
			(url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="hover:underline">${url}</a>`
		)

		logs = logs
			.split('\n')
			.map((i) => i.split(':'))
			.map((i) => ({
				type: i.shift(),
				time: i.shift(),
				text: i.join(':'),
			}))

		return flattenLogs(logs)
	}

	function flattenLogs(logs) {
		/**
		 * Flatten the logs by checking if the next value is identical to the current, if it is
		 * combine into the same line instead of breaking a new line for each item
		 */

		let _logs = []
		let condensable = []

		for (let i = 0; i < logs.length - 1; i++) {
			let current = String(logs[i].text).trim()
			let next = String(logs[i + 1].text).trim()

			if (current === '') continue
			else if (current == next) condensable.push(`${current}${next}`)
			else {
				if (condensable.length > 0) {
					_logs.push({
						type: logs[i].type,
						time: logs[i].time,
						text: condensable.join(''),
					})
					condensable = []
				} else _logs.push(logs[i])
			}
		}

		return _logs
	}

	function getBuildDuration() {
		if (deployment.created && deployment.updated)
			return formatDuration(
				intervalToDuration({
					start: new Date(deployment.created),
					end: new Date(deployment.updated),
				})
			)
	}

	function isWarningLine(text) {
		return /warn/.test(text)
	}

	function isErrorLine(type, text) {
		return type === 'stderr' && (/erorr/.test(text) || /exit/.test(text))
	}

	return (
		<Container>
			<Nav active={null} />
			{deployment && project ? (
				<div className='flex flex-col md:flex-row'>
					<ProjectSidebar id={deployment.project} active='deployments' title={project.name} />
					<main className='bg-white rounded-lg shadow w-full p-10'>
						<div className='mb-8'>
							<div className='flex items-center justify-between'>
								<span>
									<div className='flex item-center gap-2'>
										<b>{deployment.message || 'Deployment Info'}</b>
										{deployment.rollback && <img src='/icons/rollback.svg' className='w-4 opacity-40' />}
									</div>

									<p className='opacity-40'>
										Triggered by <span className='capitalize'>{deployment.type}</span>
										{deployment.manual && ' (Manual)'} {timeago.format(deployment.created)}
									</p>
								</span>
								<div className='flex items-center gap-2'>
									{deployment.status === 'COMPLETED' && (
										<Button onClick={() => rollback()}>
											<div className='flex gap-1.5'>
												<img src='/icons/rollback.svg' className='w-4' />
												<span>Rollback</span>
											</div>
										</Button>
									)}
									{deployment.status === 'BUILDING' && (
										<Button onClick={() => terminate()} className='text-red-600'>
											Cancel Build
										</Button>
									)}
									{deployment.status === 'QUEUED' && (
										<Button onClick={() => dequeue()} className='text-red-600'>
											Cancel Build
										</Button>
									)}
									<Dropdown
										items={[
											{
												text: 'Download Logs',
												action: {
													href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(logs),
													download: true,
												},
											},
											{
												text: 'View Source',
												action: { href: deployment.origin, target: '_blank', rel: 'noreferrer' },
												seperate: true,
											},
											{ text: 'Delete Deployment', action: { onClick: () => deleteDeployment() } },
										]}
									>
										<div className='mt-3 flex gap-1.5 w-5 items-center h-9 opacity-40 hover:opacity-70'>
											<img src='/icons/dots.svg' />
										</div>
									</Dropdown>
								</div>
							</div>
						</div>
						<div className='mb-8'>
							<div className='mb-4'>
								<b>Info</b>
							</div>
							<div className='flex flex-col gap-2 w-64'>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Status</p>
									<p>
										<Status status={deployment.status} />
									</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Created</p>
									<p>{timeago.format(deployment.created)}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Buildpack Type</p>
									<p>{deployment.buildpack || <span className='opacity-40'>Unknown</span>}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Origin</p>
									<p className='capitalize'>
										{deployment.type || <span className='opacity-40'>Unknown</span>} {deployment.manual && '(Manual)'}
									</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Project ID</p>
									<p className='font-mono'>{deployment.project}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Build ID</p>
									<p className='font-mono'>{deployment.id}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Commit ID</p>
									<p className='font-mono'>{deployment.commit || <span className='opacity-40'>Unknown</span>}</p>
								</div>
								<div className='grid grid-cols-2'>
									<p className='opacity-40'>Build Duration</p>
									<p className='flex items-center gap-2'>
										{getBuildDuration()}
										{deployment.status !== 'COMPLETED' &&
											deployment.status !== 'FAILED' &&
											deployment.status !== 'CANCELED' && <Spinner />}
									</p>
								</div>
							</div>
						</div>
						<div className='mb-8'>
							<div className='mb-4'>
								<b>Build Log</b>
							</div>
							<div className='flex gap-4 py-3.5 bg-white border rounded-lg items-start justify-between mb-3 overflow-auto'>
								{logs ? (
									<div className='flex flex-col w-full'>
										{parseToHtml(logs).map(
											({ type, time, text }) =>
												text && (
													<div
														key={text}
														className={css(
															'relative group py-1 px-5 font-mono overflow-auto whitespace-pre-wrap truncate text-sm bg-opacity-40 hover:bg-opacity-50 w-full flex items-start',
															{
																'bg-yellow-300': isWarningLine(text),
																'bg-red-400': isErrorLine(type, text),
																'hover:bg-gray-100': !isErrorLine(type, text) && !isWarningLine(text),
															}
														)}
													>
														<span className='opacity-40 min-w-max mr-4'>
															{time && formatISO9075(new Date(+time || 0), { representation: 'time' })}
														</span>
														<div className='w-full'>
															<code
																className='whitespace-pre-wrap'
																dangerouslySetInnerHTML={{ __html: text }}
															/>
															<code
																className={css(
																	'absolute top-1 right-5 text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 text-white',
																	{
																		'bg-red-500': /stderr/.test(type),
																		'bg-black': !/stderr/.test(type),
																	}
																)}
															>
																{type}
															</code>
														</div>
													</div>
												)
										)}
									</div>
								) : (
									<span className='font-mono text-sm px-5 opacity-40'>Your build logs will appear here soon...</span>
								)}
							</div>
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
