import { Spinner } from './Spinner'

export function Button(props) {
	return (
		<button
			{...props}
			className={`${props.className} grid place-items-center h-9 mt-3 bg-white rounded-lg px-3 py-1.5 text-sm transition border border-gray-300 shadow-sm hover:border-gray-400 hover:shadow active:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed`}
		>
			{props.loading ? <Spinner /> : props.children}
		</button>
	)
}
