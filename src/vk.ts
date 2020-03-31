import https from "https"
import { IncomingMessage } from "http"
import Sessions from './sessions'

const accessToken = 'd6c478cb3403c198c7015d25b798308c216ff35d37ff78cef53607f818e4446a60d0f060952d00ead472f'

export default class API {
  static call = async (methodName: string, params: object): Promise<object> => {
    params['v'] = 5.83
    params['access_token'] = accessToken
    let paramString = ''
    for (let key in params) 
      paramString += `${key}=${params[key]}&`
    paramString = encodeURI(paramString.substring(0, paramString.length - 1))
    
    const options = {
      hostname: 'api.vk.com',
      port: 443,
      path: encodeURI(`/method/${methodName}`),
      method: 'POST',
      headers: {
        'Content-Length': paramString.length
      }
    }

    let response = await ((async (): Promise<object> => {
      return new Promise((resolve, reject) => {
        let req = https.request(options, (message: IncomingMessage) => {
          message.on('data', (buffer: Buffer) => {
            let response = JSON.parse(buffer.toString())
            resolve(response)
          })
        }).write(paramString)
        // console.log('https://api.vk.com' + req.path)
      })
    })())
    return response
  }
  static sendMessage = async (peer_id: number, message: string, keyboard: string) => {
    return await API.call('messages.send', { 'peer_id': peer_id, 'message': message, 'keyboard': keyboard, 'random_id': Math.floor(Math.random() * 1000000) })
  }
  static getUser = async (user_id: number) => {
    return await API.call('users.get', { 'user_ids': user_id })
  }

  sessions: Sessions
  longPollServer: string
  longPollKey: string
  constructor(sessions: Sessions) {
    this.sessions = sessions
  }
  onMessageReceived = (id: number, flags: number, peer_id: number, timestamp: number, text: string, attachments) => {
    this.sessions.send(peer_id, attachments)
  }
  configureLongPoll = async (): Promise<number> => {
    let response = (await API.call('messages.getLongPollServer', { lp_version: 3 }))['response']
    this.longPollServer = response['server']
    this.longPollKey = response['key']
    return response['ts']
  }
  startLongPolling = (ts: number) => {
    const url = `https://${this.longPollServer}?act=a_check&key=${this.longPollKey}&wait=25&mode=2&ts=${ts}&mode=2&version=3`;
    https.get(url, (message: IncomingMessage) => { message.on('data', this.longPollHandler) })
  }
  longPollHandler = (buffer: Buffer) => {
    let response = JSON.parse(buffer.toString())

    if (response.failed) {
      (async () => { this.startLongPolling(await this.configureLongPoll()) })()
      return
    }

    response.updates.forEach((update: object) => {
      if (update[0] == 4) {
        let id = update[1]
        let flags = update[2]
        let peer_id = update[3]
        let timestamp = update[4]
        let text = update[5]
        let attachments = update[6]
        if (!(flags & 2))
          this.onMessageReceived(id, flags, peer_id, timestamp, text, attachments)
      }
    });

    this.startLongPolling(response.ts)
  }
}
