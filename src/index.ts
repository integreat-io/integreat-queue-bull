import * as Queue from 'bull'

interface Options {
  queue?: Queue.Queue,
  namespace?: string
}

function queue (options: Options) {
  const { namespace = 'great' } = options
  const queue = (options.queue) ? options.queue : new Queue(namespace)

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
    }
  }
}

export = queue
