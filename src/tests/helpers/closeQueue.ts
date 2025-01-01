import queue from '../../index.js'

export default (q: ReturnType<typeof queue>) => async () => {
  await q.queue.empty()
  await q.close()
}
