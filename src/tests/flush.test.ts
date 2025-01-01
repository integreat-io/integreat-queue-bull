import test from 'node:test'
import assert from 'node:assert/strict'
import closeQueue from './helpers/closeQueue.js'

import queue from '../index.js'

// Tests

test('should flush waiting', async (t) => {
  const job = {}
  const q = queue({ namespace: 'flush1' })
  t.after(closeQueue(q))
  await q.push(job)

  await q.flush()

  const jobs = await q.queue.getWaiting()
  assert.equal(jobs.length, 0)
})

test('should flush scheduled', async (t) => {
  const job = {}
  const q = queue({ namespace: 'flush2' })
  t.after(closeQueue(q))

  await q.push(job, Date.now() + 60000)

  await q.flush()

  const jobs = await q.queue.getDelayed()
  assert.equal(jobs.length, 0)
})
