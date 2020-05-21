import Queue = require('bull')
import Bull = require('bull')

export interface RedisOptions {
  port?: number
  host?: string
  family?: number
  path?: string
  keepAlive?: number
  connectionName?: string
  password?: string
  db?: number
  enableReadyCheck?: boolean
  keyPrefix?: string
  retryStrategy?(times: number): number | false
  maxRetriesPerRequest?: number | null
  reconnectOnError?(error: Error): boolean | 1 | 2
  enableOfflineQueue?: boolean
  connectTimeout?: number
  autoResubscribe?: boolean
  autoResendUnfulfilledCommands?: boolean
  lazyConnect?: boolean
  tls?: object
  sentinels?: Array<{ host: string; port: number }>
  name?: string
  readOnly?: boolean
  dropBufferSupport?: boolean
  showFriendlyErrorStack?: boolean
}

export interface Options {
  queue?: Queue.Queue
  namespace?: string
  maxConcurrency?: number
  redis?: string | RedisOptions
  keyPrefix?: string
  bullSettings?: Bull.AdvancedSettings
}

export interface Response {
  status: string
  error?: string
  data?: unknown
}

export interface Handler {
  (data: any): Promise<Response | unknown>
}

const isResponse = (response: unknown): response is Response =>
  typeof response === 'object' &&
  response !== null &&
  typeof (response as any).status === 'string'

const createQueue = (
  namespace: string,
  prefix: string,
  redis?: string | RedisOptions | null,
  settings = {}
) =>
  typeof redis === 'string'
    ? new Queue(namespace, redis, { prefix, settings })
    : typeof redis === 'object' && redis !== null
    ? new Queue(namespace, { redis, prefix, settings } as Queue.QueueOptions)
    : new Queue(namespace, { prefix, settings })

function queue(options: Options) {
  const {
    namespace = 'great',
    maxConcurrency = 1,
    redis,
    bullSettings,
    keyPrefix = 'bull',
  } = options
  const queue = options.queue
    ? options.queue
    : createQueue(namespace, keyPrefix, redis, bullSettings)
  let subscribed = false

  return {
    queue,
    namespace,

    /**
     * Push a job to the queue. If a timestamp is included, the job is
     * scheduled for that time. If not, the action is «scheduled» for right now.
     */
    async push(payload: object, timestamp?: number, id?: string) {
      if (!payload) {
        return null
      }

      const opts: Queue.JobOptions = {}
      if (typeof timestamp !== 'undefined' && !isNaN(timestamp)) {
        opts.delay = timestamp - Date.now()
      }
      if (typeof id !== 'undefined') {
        opts.jobId = id
      }

      try {
        const job = await queue.add(payload, opts)
        return job.id
      } catch (error) {
        return null
      }
    },

    /**
     * Subscribe to queue. Whenever a scheduled time is reached,
     * subscribed handlers are called with the respective action.
     * Return a subscription handle, used for unsubscribing.
     */
    async subscribe(handler: Handler) {
      subscribed = true

      await queue.process(maxConcurrency, async (job: Queue.Job) => {
        if (subscribed) {
          const ret = await handler({ id: job.id, ...job.data })
          if (
            !isResponse(ret) ||
            ['ok', 'noaction', 'queued'].includes(ret.status)
          ) {
            return ret
          } else {
            throw new Error(`${ret.error} [${ret.status}]`)
          }
        }

        return null
      })

      return null
    },

    /**
     * Unsubscribe from scheduler queue. Subscription is identified with the
     * handler from the `subscribe` method.
     */
    async unsubscribe(_handle: any) {
      subscribed = false
    },

    /**
     * Clean completed jobs.
     */
    async clean(ms = 0) {
      return queue.clean(ms, 'completed')
    },

    /**
     * Flush all queued jobs, i.e. waiting and scheduled.
     * Active jobs are not flushed.
     */
    async flush() {
      return Promise.all([queue.clean(0, 'wait'), queue.clean(0, 'delayed')])
    },

    /**
     * Flush all scheduled jobs.
     */
    async flushScheduled() {
      return queue.clean(0, 'delayed')
    },
  }
}

export default queue
