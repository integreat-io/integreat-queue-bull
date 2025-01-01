import test from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import type { Queue } from 'bull'

import queue from '../index.js'

// Tests

test('should clean completed', async () => {
  const stubQueue = { clean: sinon.stub().resolves([1, 2]) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as unknown as Queue,
  })

  await q.clean()

  assert.equal(stubQueue.clean.callCount, 1)
  assert.equal(stubQueue.clean.args[0][0], 0)
  assert.equal(stubQueue.clean.args[0][1], 'completed')
})

test('should clean completed older than one hour', async () => {
  const stubQueue = { clean: sinon.stub().resolves([1, 2]) }
  const q = queue({
    namespace: 'clean1',
    queue: stubQueue as unknown as Queue,
  })

  await q.clean(3600000)

  assert.equal(stubQueue.clean.callCount, 1)
  assert.equal(stubQueue.clean.args[0][0], 3600000)
  assert.equal(stubQueue.clean.args[0][1], 'completed')
})
