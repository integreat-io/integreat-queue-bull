import test from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import type { Queue } from 'bull'

import queue from '../index.js'

// Tests

test('should close connection', async () => {
  const stubQueue = { close: sinon.stub().resolves(undefined) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as unknown as Queue,
  })

  await q.close()

  assert.equal(stubQueue.close.callCount, 1)
})
