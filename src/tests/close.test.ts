import test from 'ava'
import sinon = require('sinon')

import queue from '..'

// Tests

test('should close connection', async t => {
  const stubQueue = { close: sinon.stub().resolves(undefined) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as any
  })

  await q.close()

  t.is(stubQueue.close.callCount, 1)
})
