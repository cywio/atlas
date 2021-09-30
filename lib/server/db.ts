import { PrismaClient } from '@prisma/client'

declare global {
	var pc: PrismaClient
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient()
} else {
	if (!global.pc) global.pc = new PrismaClient()
	prisma = global.pc
}

export default prisma
