interface button {
  label: string,
  command: string,
  color?: string
}

export default class Keyboard {
  static create(buttons: button[][]): string {
    let keyboard = {
      one_time: true,
      buttons: []
    }

    buttons.forEach(row => {
      keyboard.buttons.push([])
      row.forEach(button => {
        keyboard.buttons[keyboard.buttons.length - 1].push({
          action: {
            type: 'text',
            label: button.label,
            payload: `{"command": "${button.command}"}`
          },
          color: button.color ? button.color : 'primary'
        })
      })
    });

    return JSON.stringify(keyboard)
  }
  static empty = (): string => {
    return Keyboard.create([])
  }
}
