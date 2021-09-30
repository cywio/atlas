import { Toaster } from 'react-hot-toast'
import 'tailwindcss/tailwind.css'
import '../styles/global.css'

function MyApp({ Component, pageProps }) {
	return (
		<>
			<Toaster />
			<Component {...pageProps} />
		</>
	)
}

export default MyApp
