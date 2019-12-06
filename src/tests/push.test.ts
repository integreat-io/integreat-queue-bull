import test from 'ava'
import sinon = require('sinon')

import queue from '..'

// Helpers

let namescapeCount = 1
const nextNamespace = () => 'push' + namescapeCount++

test.afterEach.always(async t => {
  const q = (t.context as any).q
  if (q) {
    return q.queue.empty()
  }
})

// Tests

test('should push job to queue', async t => {
  const job = {}
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))

  await q.push(job)

  const jobs = await q.queue.getWaiting()
  t.is(jobs.length, 1)
  t.deepEqual(jobs[0].data, job)
})

test('should return job id', async t => {
  const job = {}
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))

  const ret = await q.push(job)

  const jobs = await q.queue.getWaiting()
  const id = jobs[0].id
  t.is(ret, id)
})

test('should use provided job id', async t => {
  const job = {}
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))
  const id = 'theid'

  const ret = await q.push(job, undefined, id)

  const jobs = await q.queue.getWaiting()
  t.is(jobs[0].id, id)
  t.is(ret, id)
})

test('should not push null to queue', async t => {
  const job = null
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))

  const ret = await q.push(job as any)

  const jobs = await q.queue.getWaiting()
  t.is(jobs.length, 0)
  t.is(ret, null)
})

test('should schedule job', async t => {
  const job = {}
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))
  const timestamp = Date.now() + 60000

  const ret = await q.push(job, timestamp)

  const jobs = await q.queue.getDelayed()
  t.is(jobs.length, 1)
  t.is(ret, jobs[0].id)
})

test('should schedule job with the right number of microseconds', async t => {
  const job = {}
  const stubQ = { add: sinon.stub().resolves({ id: 'stubbed1' }) }
  const q = queue({ namespace: nextNamespace(), queue: stubQ as any })
  const timestamp = Date.now() + 60000

  const ret = await q.push(job, timestamp)

  t.is(ret, 'stubbed1')
  t.is(stubQ.add.callCount, 1)
  const opts = stubQ.add.args[0][1]
  t.is(opts.delay, 60000) // Will fail if test takes longer than 1 ms
})

test('should push without schedule on invalid timestamp', async t => {
  const job = {}
  const q = ((t.context as any).q = queue({ namespace: nextNamespace() }))
  const timestamp = 'invalid'

  await q.push(job, timestamp as any)

  const delayedCount = await q.queue.getDelayedCount()
  const waitingCount = await q.queue.getWaitingCount()
  t.is(delayedCount, 0)
  t.is(waitingCount, 1)
})

test('should not push when queue is closed', async t => {
  const job = {}
  const q = queue({ namespace: nextNamespace() })
  await q.queue.close()

  let ret
  await t.notThrowsAsync(async () => {
    ret = await q.push(job)
  })

  t.is(ret, null)
})
