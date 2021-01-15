import test from 'ava'
import sinon = require('sinon')

import queue from '..'

// Tests

test('should call subscribed handler', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: sinon.stub().resolves(undefined) }
  const handler = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job }) // Call handler to make sure it calls our handler

  t.is(bull.process.callCount, 1)
  t.is(bull.process.args[0][0], 1) // Default concurrency
  t.is(handler.callCount, 1)
  t.deepEqual(handler.args[0][0], job)
  t.is(bull.resume.callCount, 1)
})

test('should call the latest subscribed handler only', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler1 = sinon.stub().resolves({ status: 'ok', data: [] })
  const handler2 = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler1)
  await q.subscribe(handler2)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job }) // Call handler to make sure it calls our handler

  t.is(bull.process.callCount, 1)
  t.is(bull.process.args[0][0], 1) // Default concurrency
  t.is(handler1.callCount, 0)
  t.is(handler2.callCount, 1)
  t.deepEqual(handler2.args[0][0], job)
})

test('should set id on data', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler = sinon.stub().resolves({ status: 'ok', data: [] })
  const job = {}
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job, id: 'job2' }) // Call handler to make sure it calls our handler

  const calledData = handler.args[0][0]
  t.is(calledData.id, 'job2')
})

test('should call subscribed with maxConcurrency', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler = async () => ({ status: 'ok', data: [] })
  const q = queue({ queue: bull as any, maxConcurrency: 5 })

  await q.subscribe(handler)

  t.is(bull.process.args[0][0], 5)
})

test('should do nothing when handler is not a function', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: sinon.stub().resolves(undefined) }
  const handler = null
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler as any)

  t.is(bull.process.callCount, 0)
  t.is(bull.resume.callCount, 0)
})

test('should reject when handler returns an error response', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler = sinon.stub().resolves({ status: 'error', error: 'Ohno' })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  const err = await t.throwsAsync(processFn({ data: job }))
  t.is(err.message, 'Ohno [error]')
})

test('should not reject on noaction', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler = sinon.stub().resolves({
    status: 'noaction',
    error: 'Nothing to do'
  })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  await t.notThrowsAsync(processFn({ data: job }))
})

test('should not reject on queued', async t => {
  const bull = { process: sinon.stub().resolves({}), resume: async () => undefined }
  const handler = sinon.stub().resolves({
    status: 'queued',
    data: []
  })
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]

  await t.notThrowsAsync(processFn({ data: job }))
})

test('should unsubscribe', async t => {
  const bull = {
    process: sinon.stub().resolves({}),
    pause: sinon.stub().resolves(undefined),
    resume: async () => undefined
  }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  const handle = q.subscribe(handler)
  await q.unsubscribe(handle)
  const processFn = bull.process.args[0][1]
  await processFn(job) // Call handler to make sure it calls our handler

  t.is(handler.callCount, 0)
  t.is(bull.pause.callCount, 1)
})

test('should reject when process promise rejects', async t => {
  const bull = { process: sinon.stub().rejects('Wrongdoing'), resume: async () => undefined }
  const handler = sinon.stub().resolves()
  const q = queue({ queue: bull as any })

  await t.throwsAsync(q.subscribe(handler))
})
