import test from 'ava'
import sinon = require('sinon')

import queue = require('..')

test('should subscribed handler', async (t) => {
  const bull = { process: sinon.spy() }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  q.subscribe(handler)

  t.is(bull.process.callCount, 1)
  t.is(bull.process.args[0][0], 1) // Default concurrency
  const processFn = bull.process.args[0][1]
  await processFn(job) // Call handler to make sure it calls our handler
  t.is(handler.callCount, 1)
  t.deepEqual(handler.args[0][0], job)
})

test('should call subscribed with maxConcurrency', (t) => {
  const bull = { process: sinon.spy() }
  const handler = async () => {}
  const q = queue({ queue: bull as any, maxConcurrency: 5 })

  q.subscribe(handler)

  t.is(bull.process.args[0][0], 5)
})

test('should unsubscribe', async (t) => {
  const bull = { process: sinon.spy() }
  const handler = sinon.stub().resolves()
  const job = { id: 'job1' }
  const q = queue({ queue: bull as any })

  const handle = q.subscribe(handler)
  q.unsubscribe(handle)
  const processFn = bull.process.args[0][1]
  await processFn(job) // Call handler to make sure it calls our handler

  t.is(handler.callCount, 0)
})
