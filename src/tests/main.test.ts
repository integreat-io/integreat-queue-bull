import test from 'ava'

import queue from '..'

// Tests

test('should return bull instance with namespace', t => {
  const bull: any = {}

  const q = queue({ queue: bull })

  t.is(q.queue, bull)
  t.is(q.namespace, 'great')
})

test('should get queue namespace from options', t => {
  const options = { namespace: 'greater' }

  const q = queue(options)

  t.is(q.namespace, 'greater')
})

test('should create queue', t => {
  const options = { namespace: 'greater' }

  const q = queue(options)

  t.truthy(q.queue)
})

test('should create queue with redis url', t => {
  const options = { namespace: 'greater', redis: 'redis://localhost:6378' }

  const q = queue(options)

  t.truthy(q.queue)
})

test('should create queue with redis options', t => {
  const options = {
    namespace: 'greater',
    redis: { host: 'localhost', port: 6378 }
  }

  const q = queue(options)

  t.truthy(q.queue)
})
