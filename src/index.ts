import * as Queue from 'bull'

interface Options {
  queue?: Queue.Queue,
  namespace?: string,
  maxConcurrency?: number
}

interface Handler {
  (data: Queue.Job): Promise<void>
}

function queue (options: Options) {
  const { namespace = 'great', maxConcurrency = 1 } = options
  const queue = (options.queue) ? options.queue : new Queue(namespace)
  let subscribed = false

  return {
    queue,
    namespace,

    /**
     * Push a job to the queue. If a timestamp is included, the job is
     * scheduled for that time. If not, the action is «scheduled» for right now.
     */
    async push (payload: object, timestamp?: number, id?: string) {
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
    subscribe (handler: Handler) {
      subscribed = true
      queue.process(maxConcurrency, async (job) => (subscribed) ? handler(job) : null)
      return null
    },

    /**
     * Unsubscribe from scheduler queue. Subscription is identified with the
     * handler from the `subscribe` method.
     */
    unsubscribe (_handle: any) {
      subscribed = false
    },

    /**
     * Flush all queued jobs, i.e. waiting and scheduled.
     * Active jobs are not flushed.
     */
    async flush () {
      queue.clean(0, 'wait' as any) // This status is not correct in the @types/bull
      queue.clean(0, 'delayed' as any)
    },

    /**
     * Flush all scheduled jobs.
     */
    async flushScheduled () {
      queue.clean(0, 'delayed' as any)
    }
  }
}

export = queue
