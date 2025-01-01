import test from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import type { Queue } from 'bull'
import closeQueue from './helpers/closeQueue.js'

import queue from '../index.js'

// Helpers

let namescapeCount = 1
const nextNamespace = () => 'push' + namescapeCount++

// Tests

test('should push job to queue', async (t) => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))

  await q.push(job)

  const jobs = await q.queue.getWaiting()
  assert.equal(jobs.length, 1)
  assert.deepEqual(jobs[0].data, job)
})

test('should return job id', async (t) => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))

  const ret = await q.push(job)

  const jobs = await q.queue.getWaiting()
  const id = jobs[0].id
  assert.equal(ret, id)
})

test('should use provided job id', async (t) => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))
  const id = 'theid'

  const ret = await q.push(job, undefined, id)

  const jobs = await q.queue.getWaiting()
  assert.equal(jobs[0].id, id)
  assert.equal(ret, id)
})

test('should not push null to queue', async (t) => {
  const job = null
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = await q.push(job as any)

  const jobs = await q.queue.getWaiting()
  assert.equal(jobs.length, 0)
  assert.equal(ret, null)
})

test('should schedule job', async (t) => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))
  const timestamp = Date.now() + 60000

  const ret = await q.push(job, timestamp)

  const jobs = await q.queue.getDelayed()
  assert.equal(jobs.length, 1)
  assert.equal(ret, jobs[0].id)
})

test('should schedule job with the right number of microseconds', async () => {
  const job = {}
  const stubQ = { add: sinon.stub().resolves({ id: 'stubbed1' }) }
  const q = queue({
    namespace: nextNamespace(),
    queue: stubQ as unknown as Queue,
  })
  const timestamp = Date.now() + 60000

  const ret = await q.push(job, timestamp)

  assert.equal(ret, 'stubbed1')
  assert.equal(stubQ.add.callCount, 1)
  const opts = stubQ.add.args[0][1]
  assert.equal(opts.delay, 60000) // Will fail if test takes longer than 1 ms
})

test('should push without schedule on invalid timestamp', async (t) => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))
  const timestamp = 'invalid'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await q.push(job, timestamp as any)

  const delayedCount = await q.queue.getDelayedCount()
  const waitingCount = await q.queue.getWaitingCount()
  assert.equal(delayedCount, 0)
  assert.equal(waitingCount, 1)
})

test('should not push when queue is closed', async () => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  await q.queue.close()

  let ret
  await assert.doesNotReject(async () => {
    ret = await q.push(job)
  })

  assert.equal(ret, null)
})
