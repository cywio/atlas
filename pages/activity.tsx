import { useState, useEffect } from 'react'
import { Nav, Spinner } from '@components'
import { useApi, useValidSession } from '@hooks'
import {dateFormat} from '@utils'

export default function Activity() {
	const [activity, setActivity] = useState(null)

	useEffect(() => {
		const hydrate = async () => {
			setActivity(await useApi('/api/activity'))
		}
		hydrate()
	}, [])

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active='activity' />
			{activity ? (
				<section className='mb-12'>
					<div className='flex items-center justify-between mb-4'>
						<h1>
							Activity <span className='opacity-40 ml-1'>{activity && activity.length}</span>
						</h1>
					</div>
					<div className='grid grid-cols-1 gap-4'>
						{activity.map((i) => {
							return (
								<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between'>
									<div className='flex gap-4 items-center max-w-lg truncate'>
										<img src={i.accounts.avatar || '/icons/avatar-default.png'} className='w-10 h-10 rounded-full' />
										<span>
											<p>{i.action}</p>
											<p className='opacity-40'>
												{i.accounts.name} ({i.accounts.email}) — {i.ip}
											</p>
										</span>
									</div>
									<p className='opacity-60'>{dateFormat(i.created)}</p>
								</div>
							)
						})}
					</div>
				</section>
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
