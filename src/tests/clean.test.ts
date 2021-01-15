import test from 'ava'
import sinon = require('sinon')

import queue from '..'

// Tests

test('should clean completed', async t => {
  const stubQueue = { clean: sinon.stub().resolves([1, 2]) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as any
  })

  await q.clean()

  t.is(stubQueue.clean.callCount, 1)
  t.is(stubQueue.clean.args[0][0], 0)
  t.is(stubQueue.clean.args[0][1], 'completed')
})

test('should clean completed older than one hour', async t => {
  const stubQueue = { clean: sinon.stub().resolves([1, 2]) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as any
  })

  await q.clean(3600000)

  t.is(stubQueue.clean.callCount, 1)
  t.is(stubQueue.clean.args[0][0], 3600000)
  t.is(stubQueue.clean.args[0][1], 'completed')
})
