export function Nothing(props) {
	return (
		<div {...props} className={`w-full h-64 border rounded-lg grid place-items-center ${props.className}`}>
			<div className='flex flex-col justify-center opacity-40 p-12'>
				<img src='/icons/alert.svg' className='w-8 m-auto mb-3' />
				<p>{props.text}</p>
			</div>
		</div>
	)
}
