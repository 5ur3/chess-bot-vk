import Board, { EndReason, figureEmojis } from './board'
import Keyboard from './keyboard'
import API from './vk'
import { findEnemy, stopFindingEnemy, endGame, cancelEndingGame, offerDraw, surrender, denyDraw, acceptDraw, moveKing, moveQueen, moveRook, moveKnight, moveBishop, movePawn, cancelFigureChoose, cancelDirectionChoose, cancelDestinationChoose, chooseQueen, chooseKnight, chooseRook, chooseBishop } from './commands'
import { ru, u, r, rd, d, ld, l, lu, lr, checkSign } from './emoji'

const figureCommands = { king: moveKing, queen: moveQueen, rook: moveRook, knight: moveKnight, bishop: moveBishop, pawn: movePawn }

export default class Session {
  board: Board = null
  send: (message: string, keyboard: string) => any
  private enqueue: () => void
  private unqueue: () => void
  private white = true
  id: number = 0
  firstName: string
  lastName: string

  constructor(id?: number, send?: (message: string, keyboard: string) => {}, enqueue?: (session: Session) => void, unqueue?: (session: Session) => void) {
    if (!id)
      return
    (async () => {
      let userInfo = await API.getUser(id)
      this.firstName = userInfo['response'][0]['first_name']
      this.lastName = userInfo['response'][0]['last_name']
    })()
    this.id = id
    this.send = send
    this.enqueue = enqueue.bind(this, this)
    this.unqueue = unqueue.bind(this, this)
    this.send('Выберите действие:', Keyboard.create([[{ label: 'Найти соперника', command: findEnemy }]]))
  }

  copy = () => {
    let session = new Session()
    session.id = this.id
    session.send = this.send
    session.enqueue = this.enqueue
    session.unqueue = this.unqueue
    session.firstName = this.firstName
    session.lastName = this.lastName
    session.board = this.board
    return session
  }
  onFindEnemy = () => {
    this.send('Поиск противника...', Keyboard.create([[{ label: 'Остановить поиск', command: stopFindingEnemy }]]))
    this.enqueue()
  }
  onStopFindingEnemy = () => {
    this.unqueue()
    this.send('Выберите действие:', Keyboard.create([[{ label: 'Найти соперника', command: findEnemy }]]))
  }
  onEndGame = () =>
    this.send(`Завершение игры:`, Keyboard.create([[{ label: 'Отмена', command: cancelEndingGame }, { label: 'Ничья', command: offerDraw, color: 'negative' }, { label: 'Сдаться', command: surrender, color: 'negative' }]]))
  onCancelEndingGame = () =>
    this.onGameUpdated()
  onOfferDraw = () =>
    this.board.offerDraw(this)
  onSurrender = () =>
    this.board.surrender(this)
  onDenyDraw = () =>
    this.board.denyDraw(this)
  onAcceptDraw = () =>
    this.board.acceptDraw(this)

  onMoveKing = () => {
    this.board.choseFigure(this, 'king')
    this.onMove()
  }
  onMoveQueen = () => {
    this.board.choseFigure(this, 'queen')
    this.onMove()
  }
  onMoveRook = () => {
    this.board.choseFigure(this, 'rook')
    this.onMove()
  }
  onMoveKnight = () => {
    this.board.choseFigure(this, 'knight')
    this.onMove()
  }
  onMoveBishop = () => {
    this.board.choseFigure(this, 'bishop')
    this.onMove()
  }
  onMovePawn = () => {
    this.board.choseFigure(this, 'pawn')
    this.onMove()
  }
  onMove = () => {
    let positions = this.board.figures[this.board.getColor(this)][this.board.chosenFigure]
    if (positions.length == 1) {
      this.onFigureChosen(positions[0].x, positions[0].y, true)
      return
    }
    positions.sort(this.board.cellSorter.bind(this, this))
    let buttons = []
    let rows = []
    for (let i = 0; i < positions.length; i++) {
      if (i % 4 == 0)
        rows.push([])
      rows[rows.length - 1].push(positions[i])
    }
    const xs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    rows.forEach(row => {
      buttons.push([])
      row.forEach(position => {
        buttons[buttons.length - 1].push({ label: xs[position['x']] + (position['y'] + 1).toString(), command: `fr${position['x']}${position['y']}` })
      });
    });
    this.send(`Выберите фигуру: (${figureEmojis[this.board.getColor(this)][this.board.chosenFigure]})`, Keyboard.create([...buttons, [{ label: 'Назад', command: cancelFigureChoose, color: 'negative' }]]))
  }
  onFigureChosen = (x: number, y: number, fromMove?: boolean) => {
    this.board.chosePosition(this, { x: x, y: y })
    let directions = this.board.getMoveDirections(this)
    let buttons = []
    const directionNames = ['ld', 'l', 'lu', 'u', 'ru', 'r', 'rd', 'd']
    const directionEmojis = [ld, l, lu, u, ru, r, rd, d]
    for (let i = 0; i < 8; i++) {
      if (directions[i] == 1) {
        if (buttons.length == 0 || buttons[buttons.length - 1].length == 3)
          buttons.push([])
        buttons[buttons.length - 1].push({ label: directionEmojis[i], command: `di${directionNames[i]}` })
      }
    }

    if (buttons.length == 0) {
      this.send(`Этой фигуре некуда ходить`, Keyboard.create([[{ label: 'Назад', command: fromMove ? cancelFigureChoose : cancelDirectionChoose, color: 'negative' }]]))
      return
    }
    if (buttons[0].length == 1) {
      this.onDirectionChosen(buttons[0][0].command.substring(2), fromMove, true)
      return
    }

    buttons.forEach(row => {
      row.forEach(button => {
        let direction = button.command.substring(2)
        let directionIndex = 0
        for (let i = 0; i < 8; i++)
          if (direction == directionNames[i])
            directionIndex = i

        let options = this.board.getOptionsByDirection(this, directionIndex)
        let figure = ''
        let figure2 = ''
        let check = false
        options.forEach(option => {
          let res = this.board.getMoveResult(this, option.x, option.y)
          if (res && !figure)
            figure = res
          else if (res)
            figure2 = res
        });
        options.forEach(option => {
          if (this.board.getMoveCheckResult(this, option.x, option.y))
            check = true
        });
        if (figure) {
          button.label += `${figureEmojis[this.board.getEnemyColor(this)][figure]}`
          button.color = 'negative'
        }
        if (figure2)
          button.label += `${figureEmojis[this.board.getEnemyColor(this)][figure2]}`
        if (check) {
          button.label += `${checkSign}`
          button.color = 'negative'
        }
      });
    });

    this.send(`Выберите направление хода:`, Keyboard.create([...buttons, [{ label: 'Назад', command: fromMove ? cancelFigureChoose : cancelDirectionChoose, color: 'negative' }]]))
  }
  onDirectionChosen = (direction: string, fromMove?: boolean, fromFigure?: boolean) => {
    const directionNames = ['ld', 'l', 'lu', 'u', 'ru', 'r', 'rd', 'd']
    let options = []
    for (let i = 0; i < 8; i++)
      if (direction == directionNames[i])
        options = this.board.getOptionsByDirection(this, i)
    let optionsWithEnemy = this.board.getOptionsWithFigure(this, options)

    let buttons = []
    let rows = []
    for (let i = 0; i < options.length; i++) {
      if (i % 3 == 0)
        rows.push([])
      rows[rows.length - 1].push(options[i])
    }
    const xs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    let i = 0
    rows.forEach(row => {
      buttons.push([])
      row.forEach(position => {
        if (this.board.chosenFigure == 'king' && this.board.getDistance(this.board.chosenPosition, position) == 2) {
          buttons[buttons.length - 1].push({
            label: `${xs[position['x']]}${(position['y'] + 1)} (${this.board.getDistance(this.board.chosenPosition, position)}) ${figureEmojis[this.board.getColor(this)].king} ${lr} ${figureEmojis[this.board.getColor(this)].rook}`,
            command: `to${position['x']}${position['y']}`
          })
        } else {
          buttons[buttons.length - 1].push({
            label: `${xs[position['x']]}${(position['y'] + 1)} (${this.board.getDistance(this.board.chosenPosition, position)}) ${optionsWithEnemy[i] == '' ? '' : figureEmojis[this.board.getEnemyColor(this)][optionsWithEnemy[i]]}${this.board.getMoveCheckResult(this, position['x'], position['y']) ? checkSign : ''}`,
            command: `to${position['x']}${position['y']}`,
            color: (optionsWithEnemy[i] != '' || this.board.getMoveCheckResult(this, position['x'], position['y'])) ? 'negative' : 'primary'
          })
        }
        i++
      });
    });
    this.send(`Выберите ход:`, Keyboard.create([...buttons, [{ label: 'Назад', command: fromMove ? cancelFigureChoose : fromFigure ? cancelDirectionChoose : cancelDestinationChoose, color: 'negative' }]]))
  }
  onDestinationChosen = (x: number, y: number) => {
    this.board.move(this, x, y)
  }
  onCancelFigureChoose = () => {
    this.send(this.board.getUpdatesAndDeck(this), '')
    this.onGameUpdated()
  }
  onCancelDirectionChoose = () => {
    this.send(this.board.getUpdatesAndDeck(this), '')
    this.onMove()
  }
  onCancelDestinationChoose = () => {
    this.send(this.board.getUpdatesAndDeck(this), '')
    this.onFigureChosen(this.board.chosenPosition.x, this.board.chosenPosition.y)
  }
  onQueenChoose = () =>
    this.board.changePawnTo(this, 'queen')
  onKnightChoose = () =>
    this.board.changePawnTo(this, 'knight')
  onRookChoose = () =>
    this.board.changePawnTo(this, 'rook')
  onBishopChoose = () =>
    this.board.changePawnTo(this, 'bishop')


  onCommandReceived = (command: string) => {
    switch (command) {
      case findEnemy:
        return this.onFindEnemy()
      case stopFindingEnemy:
        return this.onStopFindingEnemy()
      case endGame:
        return this.onEndGame()
      case cancelEndingGame:
        return this.onCancelEndingGame()
      case offerDraw:
        return this.onOfferDraw()
      case surrender:
        return this.onSurrender()
      case denyDraw:
        return this.onDenyDraw()
      case acceptDraw:
        return this.onAcceptDraw()
      case moveKing:
        return this.onMoveKing()
      case moveQueen:
        return this.onMoveQueen()
      case moveRook:
        return this.onMoveRook()
      case moveKnight:
        return this.onMoveKnight()
      case moveBishop:
        return this.onMoveBishop()
      case movePawn:
        return this.onMovePawn()
      case cancelFigureChoose:
        return this.onCancelFigureChoose()
      case cancelDirectionChoose:
        return this.onCancelDirectionChoose()
      case cancelDestinationChoose:
        return this.onCancelDestinationChoose()
      case chooseQueen:
        return this.onQueenChoose()
      case chooseKnight:
        return this.onKnightChoose()
      case chooseRook:
        return this.onRookChoose()
      case chooseBishop:
        return this.onBishopChoose()
    }

    if (command.substring(0, 2) == 'fr')
      this.onFigureChosen(parseInt(command.substring(2, 3)), parseInt(command.substring(3, 4)))
    else if (command.substring(0, 2) == 'di')
      this.onDirectionChosen(command.substring(2))
    else if (command.substring(0, 2) == 'to')
      this.onDestinationChosen(parseInt(command.substring(2, 3)), parseInt(command.substring(3, 4)))
  }

  onGameUpdated = () => {
    if (this.board.isGameEnded()) {
      if (this.board.isGameTied())
        this.send(`${this.board.getUpdatesAndDeck(this)}\nИгра закончена\nНичья`, Keyboard.create([[{ label: 'Найти соперника', command: findEnemy }]]))
      else if (this.board.amIWinner(this))
        this.send(`${this.board.getUpdatesAndDeck(this)}\nИгра закончена\nПобеда!${this.board.getEndReason() == EndReason.surrender ? ' (Противник сдался)' : ''}`, Keyboard.create([[{ label: 'Найти соперника', command: findEnemy }]]))
      else
        this.send(`${this.board.getUpdatesAndDeck(this)}\nИгра закончена\nПоражение`, Keyboard.create([[{ label: 'Найти соперника', command: findEnemy }]]))

      return
    }
    if (this.board.isDrawOffered()) {
      if (this.board.isDrawOfferedToMe(this))
        this.send('Ваш противник предложил вам ничью', Keyboard.create([[{ label: 'Отменить', command: denyDraw }, { label: 'Ничья', command: acceptDraw, color: 'negative' }]]))
      else
        this.send('Противнику предложена ничья. Ожидание ответа...', Keyboard.create([]))
      return
    }
    if (this.board.isPawnChangeRequested(this)) {
      this.send('Замените пешку на одну из этих фигур:', Keyboard.create([[
        { label: figureEmojis[this.board.getColor(this)].queen, command: chooseQueen },
        { label: figureEmojis[this.board.getColor(this)].knight, command: chooseKnight },
        { label: figureEmojis[this.board.getColor(this)].rook, command: chooseRook },
        { label: figureEmojis[this.board.getColor(this)].bishop, command: chooseBishop }]]))
      return
    }

    let boardString = this.board.getUpdatesAndDeck(this)
    let myTurn = this.board.isMyTurn(this)
    if (myTurn) {
      let keyboard = []
      let color = this.board.getColor(this)
      for (let figureType in this.board.figures[color]) {
        if (this.board.figures[color][figureType].length) {
          if (keyboard.length == 0 || keyboard[keyboard.length - 1].length == 4)
            keyboard.push([])
          keyboard[keyboard.length - 1].push({ label: figureEmojis[color][figureType], command: figureCommands[figureType] })
        }
      }
      this.send(`${boardString}\n\nВаш ход!`, Keyboard.create([...keyboard, [{ label: 'Завершить игру', command: endGame, color: 'negative' }]]))
    }
    else
      this.send(`${boardString}\n\nОжидание хода противника...`, Keyboard.create([[{ label: 'Завершить игру', command: endGame, color: 'negative' }]]))
  }

  onGameStarted = (board: Board) => {
    this.board = board
    this.white = this.board.amIWhite(this)
    this.send(`Игра найдена!\nВаш противник: @id${this.board.getEnemyId(this)}(${this.board.getEnemyName(this)})`, Keyboard.create([]))
  }
}
