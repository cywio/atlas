import StringCrypto from 'string-crypto'

const { encryptString, decryptString } = new StringCrypto()

export function encrypt(data) {
	return encryptString(String(data), process.env.SECRET)
}

export function decrypt(data) {
	try {
		return decryptString(String(data), process.env.SECRET)
	} catch {
		return null
	}
}
