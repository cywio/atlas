import { useState, useEffect } from 'react'
import { useApi, useValidSession } from '@hooks'
import { Spinner, Nav, Button, Status } from '@components'
import * as timeago from 'timeago.js'
import Link from 'next/link'

export default function Home() {
	const [projects, setProjects] = useState(null)
	const [databases, setDatabases] = useState(null)
	const [activity, setActivity] = useState(null)

	useEffect(() => {
		const hydrate = async () => {
			setProjects(await useApi('/api/projects'))
			setDatabases(await useApi('/api/databases'))
			setActivity(await useApi('/api/activity?take=7'))
		}
		hydrate()
	}, [])

	return (
		<div className='max-w-6xl m-auto p-8'>
			<Nav active='dashboard' />
			<section className='mb-12'>
				<div className='flex items-center justify-between mb-4'>
					<h1>
						Projects <span className='opacity-40 ml-1'>{projects && projects.length}</span>
					</h1>
					<Button>New Project</Button>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{projects ? (
						projects.map((i) => {
							return (
								<Link href={`/project/${i.id}`} passHref>
									<a className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center hover:bg-gray-50 hover:border-gray-300 hover:cursor-pointer transition'>
										<img src={`https://icons.duckduckgo.com/ip3/${i.domain}.ico`} className='w-10 h-10' />
										<span>
											<b>{i.name}</b>
											<p className='opacity-40'>Created {timeago.format(i.created)}</p>
										</span>
									</a>
								</Link>
							)
						})
					) : (
						<Spinner size={24} />
					)}
				</div>
			</section>
			<section className='mb-12'>
				<div className='flex items-center justify-between mb-4'>
					<h1>
						Databases <span className='opacity-40 ml-1'>{databases && databases.length}</span>
					</h1>
					<Button>New Database</Button>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{databases ? (
						databases.map((i) => {
							return (
								<Link href={`/database/${i.id}`} passHref>
									<a className='flex justify-between gap-4 bg-white py-3.5 px-5 border rounded-lg items-center hover:bg-gray-50 hover:border-gray-300 hover:cursor-pointer transition'>
										<div className='flex flex-col gap-1'>
											<b>{i.name}</b>
											<div className='flex opacity-40 items-center'>
												<img src={`/icons/${i.type}.svg`} className='w-4 mr-3' />
												<p className='capitalize'>
													{i.type} — {i.version}
												</p>
											</div>
										</div>
										<Status status={i.status} />
									</a>
								</Link>
							)
						})
					) : (
						<Spinner size={24} />
					)}
				</div>
			</section>
			<section className='mb-12'>
				<div className='flex items-center justify-between mb-4'>
					<h1>Recent Activity</h1>
					<a href='/activity' className='text-sm opacity-60 hover:underline'>
						View All
					</a>
				</div>
				<div className='grid grid-cols-1 gap-4'>
					{activity ? (
						activity.map((i) => {
							return (
								<div className='flex gap-4 bg-white py-3.5 px-5 border rounded-lg items-center justify-between'>
									<div className='flex gap-4 items-center max-w-lg truncate'>
										<img src={i.accounts.avatar} className='w-10 h-10 rounded-full' />
										<span>
											<p>{i.action}</p>
											<p className='opacity-40'>
												{i.accounts.email}, {i.ip}
											</p>
										</span>
									</div>
									<p className='opacity-60'>{timeago.format(i.created)}</p>
								</div>
							)
						})
					) : (
						<Spinner size={24} />
					)}
				</div>
			</section>
		</div>
	)
}

export async function getServerSideProps(context) {
	return {
		props: {},
		...useValidSession(context),
	}
}
