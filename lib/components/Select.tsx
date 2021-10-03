export function Select(props) {
	return (
		<div>
			<label htmlFor='price' className='block text-sm font-medium text-gray-700'>
				{props.label}
			</label>
			<select
				{...props}
				className={`${props.className} mt-1 relative rounded-md shadow-sm p-2 border block w-full sm:text-sm border-gray-300 rounded-md mb-3`}
			>
				{props.children}
			</select>
		</div>
	)
}
