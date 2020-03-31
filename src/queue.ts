import Session from './session'
import Board from './board'

export default class Queue {
  private queue: Session[] = [];

  startGame = (sessions: Session[]) => {
    setTimeout(() => {
      let board = new Board(sessions)
      sessions[0].onGameStarted(board)
      sessions[1].onGameStarted(board)
    }, 1000);
  }
  enqueue = (session: Session) => {
    this.queue.push(session)
    if (this.queue.length >= 2) {
      this.startGame(this.queue.splice(0, 2))
    }
  }
  unqueue = (session: Session) => {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].id == session.id) {
        this.queue.splice(i, 1);
        break;
      }
    }
  }
}
