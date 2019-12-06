import test from 'ava'

import queue from '..'

// Helpers

interface Action {
  payload: object
}

let namescapeCount = 1
const nextNamespace = () => 'integration' + namescapeCount++

test.afterEach.always(async t => {
  const q = (t.context as any).q
  if (q) {
    return q.queue.empty()
  }
})

const ph = () => undefined

// Tests

test.cb('should subscribe and push', t => {
  const job: Action = { payload: { type: 'entry' } }
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))

  const handler = async (job1: Action) => {
    t.truthy(job1)
    t.deepEqual(job1.payload, job.payload)
    t.end()
  }

  q.subscribe(handler).then(ph, ph) // To satisfy linter
  q.push(job).then(ph, ph) // To satisfy linter
})
