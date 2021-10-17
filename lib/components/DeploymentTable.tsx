import { useEffect, useState } from 'react'
import { useApi } from '@hooks'
import { Spinner, Status } from '@components'
import {dateFormat} from '@utils'

export function DeploymentTable({ id, setCount = (n) => {}, limit = 0 }) {
	const [deployments, setDeployments] = useState<any>(null)

	useEffect(() => {
		const hydrate = async () => {
			if (id) setDeployments(await useApi(`/api/projects/${id}/deployments${limit ? `?take=${limit}` : ''}`))
		}
		hydrate()
	}, [id])

	useEffect(() => {
		if (deployments) setCount(deployments.length)
	}, [deployments])

	if (!deployments) return <Spinner />

	return deployments.map((i, k) => {
		return (
			<a href={`/project/${i.project}/deployments/${i.id}`}>
				<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between mb-3 hover:border-gray-400 transition'>
					<div className='flex flex-col max-w-lg truncate'>
						<span className='flex items-center gap-2'>
							<b>{i.message || `Deployment #${deployments.length - k}`}</b>
							{i.rollback && <img src='/icons/rollback.svg' className='w-4 opacity-40' />}
						</span>
						<p className='opacity-60'>Deploying from {i.type} {i.branch ? `(${i.branch})` : ''}</p>
					</div>
					<div className='flex flex-col gap-2 items-end text-right w-32'>
						<Status status={i.status} />
						<p className='opacity-60'>{dateFormat(i.created)}</p>
					</div>
				</div>
			</a>
		)
	})
}
