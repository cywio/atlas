import { promise as q } from 'fastq'
import { builder, appendToLogs } from 'lib/server/build'

export const buildQueue = q(builder, 1)
export const buildLogsQueue = q(appendToLogs, 1)
