import test from 'ava'
import sinon = require('sinon')

import queue from '..'

test('should call subscribed handler', async t => {
  const bull = { process: sinon.stub().resolves({}) }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job }) // Call handler to make sure it calls our handler

  t.is(bull.process.callCount, 1)
  t.is(bull.process.args[0][0], 1) // Default concurrency
  t.is(handler.callCount, 1)
  t.deepEqual(handler.args[0][0], job)
})

test('should set id on data', async t => {
  const bull = { process: sinon.stub().resolves({}) }
  const handler = sinon.stub().resolves()
  const job = {}
  const q = queue({ queue: bull as any })

  await q.subscribe(handler)
  const processFn = bull.process.args[0][1]
  await processFn({ data: job, id: 'job2' }) // Call handler to make sure it calls our handler

  const calledData = handler.args[0][0]
  t.is(calledData.id, 'job2')
})

test('should call subscribed with maxConcurrency', async t => {
  const bull = { process: sinon.stub().resolves({}) }
  const handler = async () => undefined
  const q = queue({ queue: bull as any, maxConcurrency: 5 })

  await q.subscribe(handler)

  t.is(bull.process.args[0][0], 5)
})

test('should unsubscribe', async t => {
  const bull = { process: sinon.stub().resolves({}) }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  const handle = q.subscribe(handler)
  await q.unsubscribe(handle)
  const processFn = bull.process.args[0][1]
  await processFn(job) // Call handler to make sure it calls our handler

  t.is(handler.callCount, 0)
})

test('should reject when process promise rejects', async t => {
  const bull = { process: sinon.stub().rejects('Wrongdoing') }
  const handler = sinon.stub().resolves()
  const q = queue({ queue: bull as any })

  await t.throwsAsync(q.subscribe(handler))
})
