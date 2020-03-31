import API from './vk'
import Sessions from './sessions'
import http from 'http'
import https from 'https'

// Heroku support
http.createServer((req, res) => { res.write(`Heroku please don't kill me I'm a web application!`); res.end(); }).listen(process.env.PORT || 3000);
setInterval(() => { https.get('https://chess-bot-vk.herokuapp.com/') }, 10 * 60 * 1000)

const sessions = new Sessions()
const api = new API(sessions);
(async () => { api.startLongPolling(await api.configureLongPoll()) })()
