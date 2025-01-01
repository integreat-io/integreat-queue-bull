import test from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import type { Queue } from 'bull'

import queue from '../index.js'

// Tests

test('should call subscribed handler', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: sinon.stub().resolves(undefined),
  }
  const handler = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job }) // Call handler to make sure it calls our handler

  assert.equal(bull.process.callCount, 1)
  assert.equal(bull.process.args[0][0], 1) // Default concurrency
  assert.equal(handler.callCount, 1)
  assert.deepEqual(handler.args[0][0], job)
  assert.equal(bull.resume.callCount, 1)
})

test('should call the latest subscribed handler only', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler1 = sinon.stub().resolves({ status: 'ok', data: [] })
  const handler2 = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler1)
  await q.subscribe(handler2)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job }) // Call handler to make sure it calls our handler

  assert.equal(bull.process.callCount, 1)
  assert.equal(bull.process.args[0][0], 1) // Default concurrency
  assert.equal(handler1.callCount, 0)
  assert.equal(handler2.callCount, 1)
  assert.deepEqual(handler2.args[0][0], job)
})

test('should set id on data', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = {}
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job, id: 'job2' }) // Call handler to make sure it calls our handler

  const calledData = handler.args[0][0]
  assert.equal(calledData.id, 'job2')
})

test('should call subscribed with maxConcurrency', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler = async () => ({ status: 'ok', data: [] })
  const q = queue({ queue: bull as unknown as Queue, maxConcurrency: 5 })

  await q.subscribe(handler)

  assert.equal(bull.process.args[0][0], 5)
})

test('should do nothing when handler is not a function', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: sinon.stub().resolves(undefined),
  }
  const handler = null
  const q = queue({ queue: bull as unknown as Queue })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await q.subscribe(handler as any)

  assert.equal(bull.process.callCount, 0)
  assert.equal(bull.resume.callCount, 0)
})

test('should reject when handler returns an error response', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves({ status: 'error', error: 'Ohno' })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  await assert.rejects(processFn({ data: job }), { message: 'Ohno [error]' })
})

test('should not reject on noaction', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves({
    status: 'noaction',
    error: 'Nothing to do',
  })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  await assert.doesNotReject(processFn({ data: job }))
})

test('should not reject on queued', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves({
    status: 'queued',
    data: [],
  })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  await assert.doesNotReject(processFn({ data: job }))
})

test('should unsubscribe', async () => {
  const bull = {
    process: sinon.stub().resolves({}),
    pause: sinon.stub().resolves(undefined),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as unknown as Queue })

  const handle = q.subscribe(handler)
  await q.unsubscribe(handle)
  const processFn = bull.process.args[0][1]
  await processFn(job) // Call handler to make sure it calls our handler

  assert.equal(handler.callCount, 0)
  assert.equal(bull.pause.callCount, 1)
})

test('should reject when process promise rejects', async () => {
  const bull = {
    process: sinon.stub().rejects('Wrongdoing'),
    resume: async () => undefined,
  }
  const handler = sinon.stub().resolves()
  const q = queue({ queue: bull as unknown as Queue })

  await assert.rejects(q.subscribe(handler))
})
