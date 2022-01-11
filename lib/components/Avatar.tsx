import Boring from 'boring-avatars'

export function Avatar({ name = 'example', image = '' }) {
	return (
		<div
			className='bg-gray-200 rounded-full min-w-max w-10 h-10 border hover:opacity-80'
			style={{
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundImage: `url(${image})`,
			}}
		>
			{name && !image && <Boring name={name} size='100%' variant='marble' />}
		</div>
	)
}
