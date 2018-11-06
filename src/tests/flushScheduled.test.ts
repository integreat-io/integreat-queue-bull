import test from 'ava'

import queue = require('..')

// Setup

test.afterEach.always(async (t) => {
  const q = (t.context as any).q
  if (q) {
    return q.queue.empty()
  }
})

// Tests

test('should flush scheduled', async (t) => {
  const job = {}
  const q = (t.context as any).q = queue({ namespace: 'flush1' })
  await q.push(job, Date.now() + 60000)

  await q.flushScheduled()

  const jobs = await q.queue.getDelayed()
  t.is(jobs.length, 0)
})

test('should not flush waiting', async (t) => {
  const job = {}
  const q = (t.context as any).q = queue({ namespace: 'flush2' })
  await q.push(job)

  await q.flushScheduled()

  const jobs = await q.queue.getWaiting()
  t.is(jobs.length, 1)
})
