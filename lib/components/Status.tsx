import { useState, useEffect } from 'react'

export function Status({ status }) {
	const [item, setItem] = useState({ color: 'gray', text: String(status).toLowerCase(), ping: false })

	useEffect(() => {
		if (status === 'BUILDING')
			setItem({
				color: 'orange',
				text: 'Building',
				ping: true,
			})
		if (status === 'FAILED')
			setItem({
				color: 'red',
				text: 'Failed',
				ping: false,
			})
		if (status === 'COMPLETED')
			setItem({
				color: 'green',
				text: 'Succcess',
				ping: false,
			})
		if (status === 'PROVISIONING')
			setItem({
				color: 'orange',
				text: 'Provisioning',
				ping: true,
			})
		if (status === 'READY')
			setItem({
				color: 'green',
				text: 'Ready',
				ping: false,
			})
		if (status === 'EXPOSED')
			setItem({
				color: 'darkorchid',
				text: 'Exposed',
				ping: false,
			})
		if (status === 'UNEXPOSED')
			setItem({
				color: 'green',
				text: 'Not Exposed',
				ping: false,
			})
		if (status === 'LIVE')
			setItem({
				color: 'green',
				text: 'Live',
				ping: true,
			})
		if (status === 'DEPLOYING')
			setItem({
				color: 'darkorchid',
				text: 'Deploying',
				ping: true,
			})
		if (status === 'INITIALIZING')
			setItem({
				color: 'royalblue',
				text: 'Initializing',
				ping: true,
			})
		if (status === 'QUEUED')
			setItem({
				color: 'teal',
				text: 'Queued',
				ping: true,
			})
	}, [status])

	return (
		<div style={{ color: item.color }} className={`text-${item.color}-800 inline-flex capitalize items-center text-xs gap-2`}>
			<div className='flex h-2 w-2'>
				{item.ping && (
					<span style={{ backgroundColor: item.color }} className='animate-ping absolute inline-flex h-2 w-2 rounded-full'></span>
				)}
				<span style={{ backgroundColor: item.color }} className={`relative inline-flex rounded-full h-2 w-2`}></span>
			</div>
			{item.text}
		</div>
	)
}
