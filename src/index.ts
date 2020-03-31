import API from './vk'
import Sessions from './sessions'
import http from 'http'

// Heroku support
http.createServer((req, res) => {res.write(`Heroku please don't kill me I'm a web application!`); res.end();}).listen(process.env.PORT || 3000);

const sessions = new Sessions()
const api = new API(sessions);
(async () => { api.startLongPolling(await api.configureLongPoll()) })()
