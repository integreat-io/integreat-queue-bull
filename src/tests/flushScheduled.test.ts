import test from 'node:test'
import assert from 'node:assert/strict'
import closeQueue from './helpers/closeQueue.js'

import queue from '../index.js'

// Tests

test('should flush scheduled', async (t) => {
  const job = {}
  const q = queue({ namespace: 'flushScheduled1' })
  t.after(closeQueue(q))
  await q.push(job, Date.now() + 60000)

  await q.flushScheduled()

  const jobs = await q.queue.getDelayed()
  assert.equal(jobs.length, 0)
})

test('should not flush waiting', async (t) => {
  const job = {}
  const q = queue({ namespace: 'flushScheduled2' })
  t.after(closeQueue(q))
  await q.push(job)

  await q.flushScheduled()

  const jobs = await q.queue.getWaiting()
  assert.equal(jobs.length, 1)
})
