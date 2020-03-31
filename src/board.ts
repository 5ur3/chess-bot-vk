import Session from './session'
import { blackCell, whiteCell, whiteKing, whiteQueen, whiteRook, whiteKnight, whiteBishop, whitePawn, blackKing, blackQueen, blackBishop, blackKnight, blackPawn, blackRook, numbers, blueSquare, yes, no, hourglass, watch, lu, u, ru, l, r, ld, d, rd } from './emoji'

export enum EndReason {
  surrender,
  win
}

export const figureEmojis = {
  white: { king: whiteKing, queen: whiteQueen, rook: whiteRook, knight: whiteKnight, bishop: whiteBishop, pawn: whitePawn },
  black: { king: blackKing, queen: blackQueen, rook: blackRook, knight: blackKnight, bishop: blackBishop, pawn: blackPawn }
};

export default class Board {
  private sessions: Session[]
  white: number
  moves = 0

  private isEnded = false
  private endReason: EndReason
  private isTie = false
  private winner = 0

  private drawOffered = false
  private drawOfferedTo = 0
  private pawnChangeRequested = false

  chosenFigure = '';
  chosenPosition = { x: 0, y: 0 };

  private pawnMoved2 = false;
  private movedPawn = { x: 0, y: 0 }

  figures = {
    white: {
      pawn: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }],
      bishop: [{ x: 2, y: 0 }, { x: 5, y: 0 }],
      knight: [{ x: 1, y: 0 }, { x: 6, y: 0 }],
      rook: [{ x: 0, y: 0 }, { x: 7, y: 0 }],
      queen: [{ x: 3, y: 0 }],
      king: [{ x: 4, y: 0 }]
    },
    black: {
      pawn: [{ x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }],
      bishop: [{ x: 2, y: 7 }, { x: 5, y: 7 }],
      knight: [{ x: 1, y: 7 }, { x: 6, y: 7 }],
      rook: [{ x: 0, y: 7 }, { x: 7, y: 7 }],
      queen: [{ x: 3, y: 7 }],
      king: [{ x: 4, y: 7 }]
    }
  }
  prevTurnFigures = {}

  movedFigures = {
    white: {
      rook: [false, false],
      king: [false]
    },
    black: {
      rook: [false, false],
      king: [false]
    }
  }

  copy = () => {
    let board = new Board([this.sessions[0].copy(), this.sessions[1].copy()]);
    ['white', 'black'].forEach(color => {
      for (let figureType in board.figures[color]) {
        board.figures[color][figureType] = []
        this.figures[color][figureType].forEach(figure => {
          board.figures[color][figureType].push({ x: figure.x, y: figure.y })
        });
      }
    });
    board.white = this.white
    board.moves = this.moves
    board.chosenFigure = this.chosenFigure
    board.chosenPosition = this.chosenPosition
    return board
  }
  copyFigures = () => {
    let figuresCopy = {}
    for (let color in this.figures) {
      figuresCopy[color] = {}
      for (let figureType in this.figures[color]) {
        figuresCopy[color][figureType] = []
        this.figures[color][figureType].forEach(figure => {
          figuresCopy[color][figureType].push({ x: figure.x, y: figure.y })
        });
      }
    }
    return figuresCopy
  }
  updateGame = () => {
    for (let i = 0; i < 2; i++)
      this.sessions[i].onGameUpdated()
  }
  constructor(sessions: Session[]) {
    this.sessions = sessions
    this.white = Math.floor(Math.random() * 2)
    this.prevTurnFigures = this.copyFigures()
    setTimeout(this.updateGame, 1000);
  }
  getColor = (session: Session) =>
    this.amIWhite(session) ? 'white' : 'black'
  getEnemyColor = (session: Session) =>
    this.amIWhite(session) ? 'black' : 'white'
  cellSorter = (session: Session, a, b): number => {
    if (a.x == b.x) {
      if (this.getColor(session) == 'white')
        return b.y - a.y
      return a.y - b.y
    }
    if (this.getColor(session) == 'white')
      return a.x - b.x
    return b.x - a.x
  }
  getDistance = (a, b) =>
    Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
  getRows = () => {
    let rows = [];
    for (let y = 0; y < 8; y++) {
      rows.push([]);
      for (let x = 0; x < 8; x++)
        rows[rows.length - 1].push({})
    }
    ['white', 'black'].forEach(color => {
      for (let figureType in this.figures[color]) {
        this.figures[color][figureType].forEach(figure => {
          rows[figure.y][figure.x] = { color: color, figureType: figureType }
        });
      }
    })
    return rows
  }
  getDeck = (session: Session, rows, deckStarter) => {
    for (let i = 0; i < 2; i++) {
      if (this.sessions[i].id != session.id)
        continue;
      let deck = deckStarter
      if (i == this.white) {
        deck += ' A . B . C . D . E . F . G . H .\n';
        for (let row = 7; row >= 0; row--) {
          for (let x = -1; x < 8; x++) {
            if (x == -1) {
              deck += numbers[row]
              continue
            }
            let cell = rows[row][x]
            if (cell.symbol)
              deck += cell.symbol
            else if (!cell.color)
              deck += (row + x) % 2 == 0 ? blackCell : whiteCell
            else if (cell.color)
              deck += figureEmojis[cell.color][cell.figureType]
          }
          deck += '\n'
        }
      } else {
        deck += ' H . G . F . E . D . C . B . A .\n';
        for (let row = 0; row < 8; row++) {
          for (let x = -1; x < 8; x++) {
            if (x == -1) {
              deck += numbers[row]
              continue
            }
            let cell = rows[row][7 - x]
            if (cell.symbol)
              deck += cell.symbol
            else if (!cell.color)
              deck += (row + x) % 2 == 0 ? blackCell : whiteCell
            else if (cell.color)
              deck += figureEmojis[cell.color][cell.figureType]
          }
          deck += '\n'
        }
      }
      return deck
    }
  }
  getCurrentDeck = (session: Session) =>
    this.getDeck(session, this.getRows(), this.isMyTurn(session) ? yes : no)
  getMoveDifference = (color: string) => {
    let difference = []
    for (let figureType in this.figures[color]) {
      for (let i = 0; i < this.figures[color][figureType].length; i++) {
        if (this.figures[color][figureType][i].x != this.prevTurnFigures[color][figureType][i].x || this.figures[color][figureType][i].y != this.prevTurnFigures[color][figureType][i].y)
          difference.push({ figureType: figureType, index: i })
      }
    }
    return difference
  }
  getLastMoveUpdates = (session: Session) => {
    let rows = this.getRows()
    let moveDifference = this.getMoveDifference(this.getEnemyColor(session))
    if (!moveDifference.length)
      return ''
    const symbols = [
      [ru, u, lu],
      [r, blueSquare, l],
      [rd, d, ld]
    ]
    moveDifference.forEach(diff => {
      let prevPos = this.prevTurnFigures[this.getEnemyColor(session)][diff.figureType][diff.index]
      let currPos = this.figures[this.getEnemyColor(session)][diff.figureType][diff.index]
      let xMove = currPos.x == prevPos.x ? 0 : currPos.x > prevPos.x ? 1 : -1
      let yMove = currPos.y == prevPos.y ? 0 : currPos.y > prevPos.y ? 1 : -1
      let y = prevPos.y
      let x = prevPos.x
      const xDiff = () => currPos.x - x
      const yDiff = () => currPos.y - y
      const normalize = (v) => Math.round((this.amIWhite(session) ? -1 : 1) * v / Math.abs(v)) + 1
      while (xDiff() || yDiff()) {
        if (Math.abs(xDiff()) == Math.abs(yDiff())) {
          rows[y][x] = { symbol: symbols[normalize(yDiff())][normalize(xDiff())] }
          x += xMove
          y += yMove
        }
        else if (Math.abs(xDiff()) > Math.abs(yDiff())) {
          rows[y][x] = { symbol: symbols[1][normalize(xDiff())] }
          x += xMove
        }
        else {
          rows[y][x] = { symbol: symbols[normalize(yDiff())][1] }
          y += yMove
        }
      }
    });
    return this.getDeck(session, rows, watch)
  }
  getUpdatesAndDeck = (session: Session) => {
    if (this.isMyTurn(session))
      return `${this.getLastMoveUpdates(session)}\n\n${this.getCurrentDeck(session)}`
    return this.getCurrentDeck(session)
  }
  isCellFree = (x: number, y: number) => {
    if (x < 0 || x > 7 || y < 0 || y > 7)
      return false
    let ok = true
    for (let figureType in this.figures.white) {
      this.figures.white[figureType].forEach(figure => {
        if (figure['x'] == x && figure['y'] == y)
          ok = false
      });
    }
    for (let figureType in this.figures.black) {
      this.figures.black[figureType].forEach(figure => {
        if (figure['x'] == x && figure['y'] == y)
          ok = false
      });
    }
    return ok
  }
  isCellOk = (x: number, y: number, color: string) => {
    if (x < 0 || x > 7 || y < 0 || y > 7)
      return false
    let ok = true
    for (let figureType in this.figures[color]) {
      this.figures[color][figureType].forEach(figure => {
        if (figure['x'] == x && figure['y'] == y)
          ok = false
      });
    }
    return ok
  }
  getMoveOptions = (session: Session, figureType: string, position) => {
    let options = []
    if (figureType == 'king') {
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          if (this.isCellOk(position.x + x, position.y + y, this.getColor(session)))
            options.push({ x: position.x + x, y: position.y + y })
      if (!this.movedFigures[this.getColor(session)].king[0]) {
        for (let i = 0; i < this.movedFigures[this.getColor(session)].rook.length; i++) {
          if (!this.movedFigures[this.getColor(session)].rook[i]) {
            if (this.figures[this.getColor(session)].rook[i].x > position.x) {
              let ok = true
              for (let x = 5; x <= 6; x++) {
                if (!this.isCellFree(x, position.y))
                  ok = false
              }
              for (let x = 4; x <= 6; x++) {
                if (this.isCellUnderAttack(session, x, position.y))
                  ok = false
              }
              if (ok)
                options.push({ x: 6, y: position.y })
            } else {
              let ok = true
              for (let x = 1; x <= 3; x++) {
                if (!this.isCellFree(x, position.y))
                  ok = false
              }
              for (let x = 2; x <= 4; x++) {
                if (this.isCellUnderAttack(session, x, position.y))
                  ok = false
              }
              if (ok)
                options.push({ x: 2, y: position.y })
            }
          }
        }
      }
    }
    if (figureType == 'rook' || figureType == 'queen') {
      for (let x = position.x + 1; x < 8; x++) {
        if (this.isCellFree(x, position.y))
          options.push({ x: x, y: position.y })
        else {
          if (this.isCellOk(x, position.y, this.getColor(session)))
            options.push({ x: x, y: position.y })
          break;
        }
      }
      for (let x = position.x - 1; x >= 0; x--) {
        if (this.isCellFree(x, position.y))
          options.push({ x: x, y: position.y })
        else {
          if (this.isCellOk(x, position.y, this.getColor(session)))
            options.push({ x: x, y: position.y })
          break;
        }
      }
      for (let y = position.y + 1; y < 8; y++) {
        if (this.isCellFree(position.x, y))
          options.push({ x: position.x, y: y })
        else {
          if (this.isCellOk(position.x, y, this.getColor(session)))
            options.push({ x: position.x, y: y })
          break;
        }
      }
      for (let y = position.y - 1; y >= 0; y--) {
        if (this.isCellFree(position.x, y))
          options.push({ x: position.x, y: y })
        else {
          if (this.isCellOk(position.x, y, this.getColor(session)))
            options.push({ x: position.x, y: y })
          break;
        }
      }
    }
    if (figureType == 'bishop' || figureType == 'queen') {
      for (let xs = -1; xs <= 1; xs += 2) {
        for (let ys = -1; ys <= 1; ys += 2) {
          for (let xy = 1; xy <= 8; xy++) {
            if (this.isCellFree(position.x + xy * xs, position.y + xy * ys))
              options.push({ x: position.x + xy * xs, y: position.y + xy * ys })
            else {
              if (this.isCellOk(position.x + xy * xs, position.y + xy * ys, this.getColor(session)))
                options.push({ x: position.x + xy * xs, y: position.y + xy * ys })
              break;
            }
          }
        }
      }
    }
    if (figureType == 'knight') {
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          if (Math.abs(x) + Math.abs(y) == 3) {
            if (this.isCellOk(position.x + x, position.y + y, this.getColor(session)))
              options.push({ x: position.x + x, y: position.y + y })
          }
        }
      }
    }
    if (figureType == 'pawn') {
      if (position.y == 6 || position.y == 1) {
        for (let y = 1; y <= 2; y++) {
          let newY = position.y + y * (this.getColor(session) == 'white' ? 1 : -1)
          if (this.isCellFree(position.x, newY))
            options.push({ x: position.x, y: newY })
          else
            break;
        }
      } else {
        let newY = position.y + (this.getColor(session) == 'white' ? 1 : -1)
        if (this.isCellFree(position.x, newY))
          options.push({ x: position.x, y: newY })
      }
      let newY = position.y + (this.getColor(session) == 'white' ? 1 : -1)
      if (this.isCellOk(position.x - 1, newY, this.getColor(session)) && !this.isCellFree(position.x - 1, newY))
        options.push({ x: position.x - 1, y: newY })
      if (this.isCellOk(position.x + 1, newY, this.getColor(session)) && !this.isCellFree(position.x + 1, newY))
        options.push({ x: position.x + 1, y: newY })

      if (this.pawnMoved2 && this.movedPawn.y == position.y && Math.abs(this.movedPawn.x - position.x) == 1)
        options.push({ x: this.movedPawn.x, y: newY })
    }

    let filteredOptions = []
    for (let i = 0; i < options.length; i++) {
      let boardCopy = this.copy()
      boardCopy.chosenFigure = figureType
      boardCopy.chosenPosition = { x: position.x, y: position.y }
      for (let j = 0; j < 2; j++)
        boardCopy.sessions[j].send = (message: string, keyboard: string) => { };
      boardCopy.move(session, options[i].x, options[i].y)
      if (!boardCopy.isCellUnderAttack(session, boardCopy.figures[boardCopy.getColor(session)].king[0].x, boardCopy.figures[boardCopy.getColor(session)].king[0].y))
        filteredOptions.push(options[i])
    }

    return filteredOptions
  }
  getAttackOptions = (session: Session, figureType: string, position) => {
    let options = []
    if (figureType == 'king') {
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          if (x != 0 || y != 0)
            options.push({ x: position.x + x, y: position.y + y })
    }
    if (figureType == 'rook' || figureType == 'queen') {
      for (let x = position.x + 1; x < 8; x++) {
        if (this.isCellFree(x, position.y))
          options.push({ x: x, y: position.y })
        else {
          options.push({ x: x, y: position.y })
          break;
        }
      }
      for (let x = position.x - 1; x >= 0; x--) {
        if (this.isCellFree(x, position.y))
          options.push({ x: x, y: position.y })
        else {
          options.push({ x: x, y: position.y })
          break;
        }
      }
      for (let y = position.y + 1; y < 8; y++) {
        if (this.isCellFree(position.x, y))
          options.push({ x: position.x, y: y })
        else {
          options.push({ x: position.x, y: y })
          break;
        }
      }
      for (let y = position.y - 1; y >= 0; y--) {
        if (this.isCellFree(position.x, y))
          options.push({ x: position.x, y: y })
        else {
          options.push({ x: position.x, y: y })
          break;
        }
      }
    }
    if (figureType == 'bishop' || figureType == 'queen') {
      for (let xs = -1; xs <= 1; xs += 2) {
        for (let ys = -1; ys <= 1; ys += 2) {
          for (let xy = 1; xy <= 8; xy++) {
            if (this.isCellFree(position.x + xy * xs, position.y + xy * ys))
              options.push({ x: position.x + xy * xs, y: position.y + xy * ys })
            else {
              options.push({ x: position.x + xy * xs, y: position.y + xy * ys })
              break;
            }
          }
        }
      }
    }
    if (figureType == 'knight') {
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          if (Math.abs(x) + Math.abs(y) == 3) {
            options.push({ x: position.x + x, y: position.y + y })
          }
        }
      }
    }
    if (figureType == 'pawn') {
      let newY = position.y + (this.getColor(session) == 'white' ? 1 : -1)
      options.push({ x: position.x - 1, y: newY })
      options.push({ x: position.x + 1, y: newY })
    }
    return options
  }
  getEnemyAttackOptions = (session: Session, figureType: string, position) => {
    let enemySession = this.sessions[0];
    if (this.sessions[0].id == session.id)
      enemySession = this.sessions[1];
    return this.getAttackOptions(enemySession, figureType, position)
  }
  getCurrentMoveOptions = (session: Session) =>
    this.getMoveOptions(session, this.chosenFigure, this.chosenPosition)
  getMoveDirections = (session: Session) => {
    let original = this.chosenPosition
    let options = this.getCurrentMoveOptions(session)
    let directions = [0, 0, 0, 0, 0, 0, 0, 0]
    options.forEach(option => {
      if (option.y - original.y > 0 && option.x == original.x)
        directions[3] = 1;
      if (option.y - original.y < 0 && option.x == original.x)
        directions[7] = 1;
      if (option.x - original.x > 0 && option.y == original.y)
        directions[5] = 1;
      if (option.x - original.x < 0 && option.y == original.y)
        directions[1] = 1;
      if (option.x - original.x > 0 && option.y - original.y > 0)
        directions[4] = 1;
      if (option.x - original.x > 0 && option.y - original.y < 0)
        directions[6] = 1;
      if (option.x - original.x < 0 && option.y - original.y < 0)
        directions[0] = 1;
      if (option.x - original.x < 0 && option.y - original.y > 0)
        directions[2] = 1;
    });
    if (this.getColor(session) == 'white')
      return directions
    else {
      let fixedDirections = [directions[4], directions[5], directions[6], directions[7], directions[0], directions[1], directions[2], directions[3]];
      return fixedDirections
    }
  }
  getOptionsByDirection = (session: Session, directionIndex: number) => {
    let original = this.chosenPosition
    let options = this.getCurrentMoveOptions(session)
    let filteredOptions = []
    options.forEach(option => {
      if ((directionIndex == 3 && this.getColor(session) == 'white' || directionIndex == 7 && this.getColor(session) == 'black') && option.y - original.y > 0 && option.x == original.x)
        filteredOptions.push(option)
      if ((directionIndex == 7 && this.getColor(session) == 'white' || directionIndex == 3 && this.getColor(session) == 'black') && option.y - original.y < 0 && option.x == original.x)
        filteredOptions.push(option)
      if ((directionIndex == 5 && this.getColor(session) == 'white' || directionIndex == 1 && this.getColor(session) == 'black') && option.x - original.x > 0 && option.y == original.y)
        filteredOptions.push(option)
      if ((directionIndex == 1 && this.getColor(session) == 'white' || directionIndex == 5 && this.getColor(session) == 'black') && option.x - original.x < 0 && option.y == original.y)
        filteredOptions.push(option)
      if ((directionIndex == 4 && this.getColor(session) == 'white' || directionIndex == 0 && this.getColor(session) == 'black') && option.x - original.x > 0 && option.y - original.y > 0)
        filteredOptions.push(option)
      if ((directionIndex == 6 && this.getColor(session) == 'white' || directionIndex == 2 && this.getColor(session) == 'black') && option.x - original.x > 0 && option.y - original.y < 0)
        filteredOptions.push(option)
      if ((directionIndex == 0 && this.getColor(session) == 'white' || directionIndex == 4 && this.getColor(session) == 'black') && option.x - original.x < 0 && option.y - original.y < 0)
        filteredOptions.push(option)
      if ((directionIndex == 2 && this.getColor(session) == 'white' || directionIndex == 6 && this.getColor(session) == 'black') && option.x - original.x < 0 && option.y - original.y > 0)
        filteredOptions.push(option)
    });
    filteredOptions.sort((a, b): number => {
      if (this.getDistance(this.chosenPosition, a) != this.getDistance(this.chosenPosition, b))
        return this.getDistance(this.chosenPosition, a) - this.getDistance(this.chosenPosition, b)
      if (this.getColor(session) == 'white')
        return a.x - b.x
      return b.x - a.x
    })
    return filteredOptions
  }
  changePawnTo = (session: Session, figureType: string) => {
    for (let i = 0; i < this.figures[this.getColor(session)].pawn.length; i++) {
      if (this.figures[this.getColor(session)].pawn[i].x == this.movedPawn.x && this.figures[this.getColor(session)].pawn[i].y == this.movedPawn.y) {
        this.figures[this.getColor(session)].pawn.splice(i, 1);
        this.figures[this.getColor(session)][figureType].push({ x: this.movedPawn.x, y: this.movedPawn.y })
        this.pawnChangeRequested = false
        this.moves++
        this.updateGame()
        return
      }
    }
  }
  move = (session: Session, x: number, y: number) => {
    if (!this.isMyTurn(session) || this.pawnChangeRequested)
      return
    this.prevTurnFigures = this.copyFigures()
    for (let i = 0; i < this.figures[this.getColor(session)][this.chosenFigure].length; i++) {
      if (this.figures[this.getColor(session)][this.chosenFigure][i].x == this.chosenPosition.x && this.figures[this.getColor(session)][this.chosenFigure][i].y == this.chosenPosition.y) {
        this.figures[this.getColor(session)][this.chosenFigure][i] = { x: x, y: y }
        if (this.chosenFigure == 'rook' || this.chosenFigure == 'king')
          this.movedFigures[this.getColor(session)][this.chosenFigure][i] = true;
        if (this.chosenFigure == 'king' && this.getDistance(this.chosenPosition, { x: x, y: y }) == 2) {
          if (x > this.chosenPosition.x) {
            for (let i = 0; i < this.figures[this.getColor(session)].rook.length; i++) {
              if (!this.movedFigures[this.getColor(session)].rook[i] && this.figures[this.getColor(session)].rook[i].x > this.chosenPosition.x) {
                this.movedFigures[this.getColor(session)].rook[i] = true
                this.figures[this.getColor(session)].rook[i].x = 5
              }
            }
          } else {
            for (let i = 0; i < this.figures[this.getColor(session)].rook.length; i++) {
              if (!this.movedFigures[this.getColor(session)].rook[i] && this.figures[this.getColor(session)].rook[i].x < this.chosenPosition.x) {
                this.movedFigures[this.getColor(session)].rook[i] = true
                this.figures[this.getColor(session)].rook[i].x = 3
              }
            }
          }
        }
      }
    }
    let enemyColor = this.getColor(session) == 'white' ? 'black' : 'white'
    for (let figureType in this.figures[enemyColor]) {
      for (let i = 0; i < this.figures[enemyColor][figureType].length; i++) {
        let figure = this.figures[enemyColor][figureType][i]
        if (figure['x'] == x && figure['y'] == y) {
          this.figures[enemyColor][figureType].splice(i, 1);
          if (figureType == 'king') {
            this.isEnded = true
            this.endReason = EndReason.win
            for (let j = 0; j < 2; j++)
              if (this.sessions[j].id == session.id)
                this.winner = j
          } else if (figureType == 'rook') {
            this.movedFigures[enemyColor].rook.splice(i, 1);
          }
        }
      }
    }

    if (this.chosenFigure == 'pawn') {
      if (Math.abs(y - this.chosenPosition.y) == 1) {
        if (this.pawnMoved2) {
          let eatDirection = this.getColor(session) == 'white' ? -1 : 1
          for (let i = 0; i < this.figures[enemyColor].pawn.length; i++) {
            let figure = this.figures[enemyColor].pawn[i]
            if (figure.x == this.movedPawn.x && figure.y == this.movedPawn.y)
              if (this.movedPawn.x == x && y + eatDirection == this.movedPawn.y)
                this.figures[enemyColor].pawn.splice(i, 1);
          }
        }
        this.pawnMoved2 = false
      } else
        this.pawnMoved2 = true
      this.movedPawn = { x: x, y: y }
    }

    if (this.chosenFigure == 'pawn' && (y == 0 || y == 7)) {
      this.pawnChangeRequested = true
      for (let i = 0; i < 2; i++)
        if (this.isMyTurn(this.sessions[i]))
          this.sessions[i].onGameUpdated()
      return
    }
    this.moves++
    this.updateGame()
  }
  getMoveResult = (session: Session, x: number, y: number) => {
    if (!this.isMyTurn(session))
      return
    let enemyColor = this.getEnemyColor(session)
    for (let figureType in this.figures[enemyColor]) {
      for (let i = 0; i < this.figures[enemyColor][figureType].length; i++) {
        let figure = this.figures[enemyColor][figureType][i]
        if (figure['x'] == x && figure['y'] == y)
          return figureType
      }
    }

    if (this.chosenFigure == 'pawn') {
      if (Math.abs(y - this.chosenPosition.y) == 1) {
        if (this.pawnMoved2) {
          let eatDirection = this.getColor(session) == 'white' ? -1 : 1
          for (let i = 0; i < this.figures[enemyColor].pawn.length; i++) {
            let figure = this.figures[enemyColor].pawn[i]
            if (figure.x == this.movedPawn.x && figure.y == this.movedPawn.y)
              if (this.movedPawn.x == x && y + eatDirection == this.movedPawn.y)
                return 'pawn'
          }
        }
      }
    }

    return ''
  }
  getMoveCheckResult = (session: Session, x: number, y: number) => {
    let boardCopy = this.copy()
    boardCopy.chosenPosition = { x: this.chosenPosition.x, y: this.chosenPosition.y }
    for (let j = 0; j < 2; j++)
      boardCopy.sessions[j].send = (message: string, keyboard: string) => { };
    boardCopy.move(session, x, y)
    return boardCopy.isEnemyCellUnderAttack(session, boardCopy.figures[boardCopy.getEnemyColor(session)].king[0].x, boardCopy.figures[boardCopy.getEnemyColor(session)].king[0].y)
  }
  isCellUnderAttack = (session: Session, x: number, y: number) => {
    let enemyColor = this.getEnemyColor(session)
    let cellsUnderAttack = new Set()
    for (let figureType in this.figures[enemyColor]) {
      this.figures[enemyColor][figureType].forEach(figure => {
        this.getEnemyAttackOptions(session, figureType, figure).forEach(option => {
          if (option.x >= 0 && option.x <= 7 && option.y >= 0 && option.y <= 7)
            cellsUnderAttack.add(option.x * 8 + option.y)
        });
      });
    }
    if (cellsUnderAttack.has(x * 8 + y))
      return true
    return false
  }
  isEnemyCellUnderAttack = (session: Session, x: number, y: number) =>
    this.isCellUnderAttack(this.sessions[0].id == session.id ? this.sessions[1] : this.sessions[0], x, y)
  getOptionsWithFigure = (session: Session, options) => {
    let optionsWithFigure = []
    for (let i = 0; i < options.length; i++)
      optionsWithFigure.push(this.getMoveResult(session, options[i].x, options[i].y))
    return optionsWithFigure
  }
  surrender = (session: Session) => {
    for (let i = 0; i < 2; i++) {
      if (this.sessions[i].id == session.id)
        continue
      this.isEnded = true
      this.endReason = EndReason.surrender
      this.winner = i
      this.updateGame()
    }
  }
  offerDraw = (session: Session) => {
    this.drawOffered = true
    for (let i = 0; i < 2; i++)
      if (session.id != this.sessions[i].id)
        this.drawOfferedTo = i;
    this.updateGame()
  }

  isGameEnded = () =>
    this.isEnded
  isPawnChangeRequested = (session: Session) =>
    this.isMyTurn(session) && this.pawnChangeRequested
  getEndReason = () =>
    this.endReason
  amIWinner = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (this.sessions[i].id == session.id && this.winner == i && this.isGameEnded())
        return true
    return false
  }
  isGameTied = () => {
    return this.isTie
  }
  isMyTurn = (session: Session) => {
    for (let i = 0; i < 2; i++) {
      if (session.id != this.sessions[i].id)
        continue

      return !((i + this.white + this.moves) % 2)
    }
  }
  amIWhite = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (session.id == this.sessions[i].id)
        return this.white == i
  }
  isDrawOffered = () => this.drawOffered
  isDrawOfferedToMe = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (session.id == this.sessions[i].id)
        return this.drawOffered && this.drawOfferedTo == i
  }
  denyDraw = (session: Session) => {
    for (let i = 0; i < 2; i++) {
      if (this.sessions[i].id == session.id)
        continue
      this.sessions[i].send('Противник не согласен на ничью', '')
    }

    this.drawOffered = false
    this.updateGame()
  }
  acceptDraw = (session: Session) => {
    this.isEnded = true
    this.isTie = true
    this.updateGame()
  }
  getEnemyFirstName = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (this.sessions[i].id != session.id)
        return this.sessions[i].firstName
  }
  getEnemyLastName = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (this.sessions[i].id != session.id)
        return this.sessions[i].lastName
  }
  getEnemyName = (session: Session) =>
    `${this.getEnemyFirstName(session)} ${this.getEnemyLastName(session)}`
  getEnemyId = (session: Session) => {
    for (let i = 0; i < 2; i++)
      if (this.sessions[i].id != session.id)
        return this.sessions[i].id
  }

  choseFigure = (session: Session, figure: string) => {
    if (this.isMyTurn(session))
      this.chosenFigure = figure
  }
  chosePosition = (session: Session, position) => {
    if (this.isMyTurn(session))
      this.chosenPosition = position
  }
}
