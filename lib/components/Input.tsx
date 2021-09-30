export function Input(props) {
	return (
		<div>
			<label htmlFor='price' className='block text-sm font-medium text-gray-700'>
				{props.label}
			</label>
			<div className='mt-1 relative rounded-md shadow-sm'>
				<input {...props} className='p-2 border block w-full sm:text-sm border-gray-300 rounded-md mb-3' />
			</div>
		</div>
	)
}
