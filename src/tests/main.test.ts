import test from 'ava'

import queue = require('..')

// Tests

test('should return bee instance with namespace', (t) => {
  const bee: any = {}

  const q = queue({ queue: bee })

  t.is(q.queue, bee)
  t.is(q.namespace, 'great')
})

test('should get queue namespace from options', (t) => {
  const options = { namespace: 'greater' }

  const q = queue(options)

  t.is(q.namespace, 'greater')
})
