export function Spinner({ size = 15 }) {
	return (
		<svg width={size} height={size} viewBox={`0 0 40 40`} xmlns='http://www.w3.org/2000/svg'>
			<defs>
				<linearGradient id='a'>
					<stop stop-color='#777' stop-opacity='0' offset='0%' />
					<stop stop-color='#777' stop-opacity='.5' offset='50%' />
					<stop stop-color='#777' offset='100%' />
				</linearGradient>
			</defs>
			<g fill='none' fill-rule='evenodd'>
				<g transform='translate(1 1)'>
					<path d='M36 18c0-9.94-8.06-18-18-18' stroke='url(#a)' stroke-width='3'>
						<animateTransform
							attributeName='transform'
							type='rotate'
							from='0 18 18'
							to='360 18 18'
							dur='0.8s'
							repeatCount='indefinite'
						/>
					</path>
				</g>
			</g>
		</svg>
	)
}
