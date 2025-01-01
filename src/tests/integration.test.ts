import test from 'node:test'
import assert from 'node:assert/strict'
import type { Action } from 'integreat'
import closeQueue from './helpers/closeQueue.js'

import queue from '../index.js'

// Helpers

let namescapeCount = 1
const nextNamespace = () => 'integration' + namescapeCount++

// Tests

test('should subscribe and push', (t, done) => {
  const job = { type: 'GET', payload: { type: 'entry' } }
  const q = queue({ namespace: nextNamespace() })
  t.after(closeQueue(q))

  const handler = async (job1: unknown) => {
    assert.equal(!!job1, true)
    assert.deepEqual((job1 as Action).payload, job.payload)
    done()
    return { status: 'ok' }
  }

  q.subscribe(handler)
  q.push(job)
})
