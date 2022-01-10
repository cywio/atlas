import { promise as q } from 'fastq'
import { builder } from 'lib/server/build'

export const buildQueue = q(builder, 1)
