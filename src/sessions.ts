import Session from './session'
import Queue from './queue'
import API from './vk'

export default class Sessions {
  sessions: Record<number, Session> = {}
  queue: Queue = new Queue()

  private exists = (id: number) => {
    return !!this.sessions[id]
  }
  private create = (id: number) => {
    const send = (message: string, keyboard: string) => API.sendMessage(id, message, keyboard)
    this.sessions[id] = new Session(id, send, this.queue.enqueue, this.queue.unqueue)
  }
  send = (id: number, attachments: string) => {
    let payload = attachments['payload']
    if (!this.exists(id))
      this.create(id)
    const command = payload && JSON.parse(payload) && JSON.parse(payload).command ? JSON.parse(payload).command : ''
    this.sessions[id].onCommandReceived(command)
  }
}
