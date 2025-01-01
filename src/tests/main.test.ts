import test from 'node:test'
import assert from 'node:assert/strict'
import closeQueue from './helpers/closeQueue.js'
import type { Queue } from 'bull'

import queue from '../index.js'

// Tests

test('should return bull instance with namespace', () => {
  const bull = {} as Queue

  const q = queue({ queue: bull })

  assert.equal(q.queue, bull)
  assert.equal(q.namespace, 'great')
})

test('should get queue namespace from options', (t) => {
  const options = { namespace: 'greater' }

  const q = queue(options)
  t.after(closeQueue(q))

  assert.equal(q.namespace, 'greater')
})

test('should create queue', (t) => {
  const options = { namespace: 'greater' }

  const q = queue(options)
  t.after(closeQueue(q))

  assert.equal(!!q.queue, true)
})

// Not sure this test really addresses what we're testing -- it should probably
// test with a different redis database
test('should create queue with redis url', (t) => {
  const options = { namespace: 'greater', redis: 'redis://localhost:6379' }

  const q = queue(options)
  t.after(closeQueue(q))

  assert.equal(!!q.queue, true)
})

// Not sure this test really addresses what we're testing -- it should probably
// test with a different redis database
test('should create queue with redis options', (t) => {
  const options = {
    namespace: 'greater',
    redis: { host: 'localhost', port: 6379 },
  }

  const q = queue(options)
  t.after(closeQueue(q))

  assert.equal(!!q.queue, true)
})
