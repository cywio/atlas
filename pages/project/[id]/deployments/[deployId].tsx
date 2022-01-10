import { useState, useEffect } from 'react'
import { useInterval, useApi, useValidSession } from '@hooks'
import { Status, Nav, ProjectSidebar, Spinner, Button } from '@components'
import { intervalToDuration, formatDuration } from 'date-fns'
import { useRouter } from 'next/router'
import * as timeago from 'timeago.js'
import toast from 'react-hot-toast'
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
			if (id) setLogs(ansiToHtml(await useApi(`/api/projects/${id}/deployments/${deployId}/logs`)))
		}
		hydrate()
	}, [id, deployId])

	useInterval(
		async () => {
			if (id) setLogs(ansiToHtml(await useApi(`/api/projects/${id}/deployments/${deployId}/logs`)))
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

	function ansiToHtml(logs) {
		let convert = new ansi()
		return convert.ansi_to_html(logs)
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

	return (
		<div className='max-w-6xl m-auto p-8'>
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
							<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-start justify-between mb-3'>
								{logs ? (
									<div className='font-mono whitespace-pre-wrap text-sm' dangerouslySetInnerHTML={{ __html: logs }} />
								) : (
									<span className='opacity-40'>Your build logs will appear here soon...</span>
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
		</div>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
