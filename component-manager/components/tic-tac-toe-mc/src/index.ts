import { ComponentSettings, Manager, Client } from '@managed-components/types'
import handlebars from 'handlebars'
import widgetHTML from './templates/widget.html'

const WORKER_URL = 'https://tic-tac-toe-worker.jestin-17.workers.dev'

function buildInitialGrid(size: number): string[][] {
  const grid: string[][] = []
  for (let i = 0; i < size; i++) {
    grid.push(Array(size).fill(''))
  }
  return grid
}

const initialGridData = buildInitialGrid(3)

function reset(client: Client): void {
  client.set('grid-data', JSON.stringify(initialGridData))
  client.set('side', undefined)
  client.set('possibilities', undefined)

  // Reset HTML
  client.execute(`
    let chooseSide = document.querySelector('div#choose-side')
    let paragraph = document.createElement("p")
    let textNode = document.createTextNode("Choose your side:")
    paragraph.appendChild(textNode)
    chooseSide.appendChild(paragraph)
    let button1 = document.createElement("button")
    button1.id = "side-x"
    button1.onclick = function() { onSideClick('X') }
    button1.innerHTML = 'X'
    chooseSide.appendChild(button1)
    let button2 = document.createElement("button")
    button2.id = "side-o"
    button2.onclick = function() { onSideClick('O') }
    button2.innerHTML = 'O'
    chooseSide.appendChild(button2)

    let banner = document.querySelector('div#banner')
    banner.innerHTML = ''
  `)

  let squareReset = ''
  for (let row = 0; row < initialGridData.length; row++) {
    for (let col = 0; col < initialGridData[0].length; col++) {
      squareReset += `document.querySelector('button#square-${row}-${col}').innerHTML = ''\n`
    }
  }
  client.execute(squareReset)
}

function checkWinner(gridData: string[][]): string | null {
  // Check each row
  for (let row = 0; row < gridData.length; row++) {
    let previous: string | null = null
    let match: boolean = true
    for (let col = 0; col < gridData[0].length; col++) {
      if (previous !== null && gridData[row][col] !== previous) {
        match = false
        break
      }
      previous = gridData[row][col]
    }
    if (match) {
      return previous
    }
  }

  // Check each column
  for (let col = 0; col < gridData[0].length; col++) {
    let previous: string | null = null
    let match: boolean = true
    for (let row = 0; row < gridData.length; row++) {
      if (previous !== null && gridData[row][col] !== previous) {
        match = false
        break
      }
      previous = gridData[row][col]
    }
    if (match) {
      return previous
    }
  }

  // Check the diagonals
  let previous: string | null = null
  let match: boolean = true
  for (let index = 0; index < gridData.length; index++) {
    if (previous !== null && gridData[index][index] !== previous) {
      match = false
      break
    }
    previous = gridData[index][index]
  }
  if (match) {
    return previous
  }

  previous = null
  match = true
  for (let index = 0; index < gridData.length; index++) {
    if (
      previous !== null &&
      gridData[gridData.length - 1 - index][index] !== previous
    ) {
      match = false
      break
    }
    previous = gridData[gridData.length - 1 - index][index]
  }
  if (match) {
    return previous
  }

  return null
}

function checkDraw(gridData: string[][]): boolean {
  for (let row = 0; row < gridData.length; row++) {
    for (let col = 0; col < gridData[0].length; col++) {
      if (gridData[row][col] === '') {
        return false
      }
    }
  }

  return true
}

function displayBanner(client: Client, text: string): void {
  client.execute(`
    let banner = document.querySelector('div#banner')
    let bannerHeader = document.createElement('h2')
    bannerHeader.innerHTML = "${text}"
    banner.innerHTML = ''
    banner.appendChild(bannerHeader)
  `)
}

export default async function (manager: Manager, _settings: ComponentSettings) {
  const stylesheet = manager.serve('/app.css', 'assets/css/app.css')
  const compiledTemplate = handlebars.compile(widgetHTML)

  manager.addEventListener('pageview', async event => {
    const { client } = event
    reset(client)
  })

  manager.addEventListener('reset', async event => {
    const { client } = event
    reset(client)
  })

  manager.addEventListener('side-click', async event => {
    const { client, payload } = event
    client.set('side', payload.side)
    client.execute(`
      let sideDiv = document.getElementById('choose-side')
      sideDiv.innerHTML = ''
    `)
    displayBanner(client, 'Your turn')
  })

  manager.addEventListener('square-click', async event => {
    const { client, payload } = event
    const { row, col } = payload
    const side = client.get('side')
    const gridDataString = client.get('grid-data')
    const possibilitiesString = client.get('possibilities')

    if (!gridDataString) {
      console.log('Error while retrieving grid data')
      return
    }
    if (!side) {
      console.log('No side chosen yet')
      return
    }

    const computerSide = side === 'X' ? 'O' : 'X'
    const gridData = JSON.parse(gridDataString)

    if (possibilitiesString !== undefined) {
      const possibilities = JSON.parse(possibilitiesString) as {
        row: number
        col: number
      }[]
      let found = false
      for (const possibility of possibilities) {
        if (possibility.row === row && possibility.col === col) {
          found = true
        }
      }
      if (!found) {
        console.log('Position not possible')
        return
      }
    }

    gridData[row][col] = side
    client.execute(`
      let button = document.getElementById('square-${row}-${col}')
      button.innerHTML = '${side}'
    `)

    const winner = checkWinner(gridData)
    if (winner) {
      console.log('Winner:', winner)
      const bannerText = winner === side ? 'You win!' : 'You lose :o'
      displayBanner(client, bannerText)
      return
    }

    const isDraw = checkDraw(gridData)
    if (isDraw) {
      console.log('Draw')
      displayBanner(client, 'Draw')
      return
    }

    try {
      const response = await manager.fetch(`${WORKER_URL}/play`, {
        method: 'POST',
        body: JSON.stringify({ gridData, side, position: { row, col } }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response) {
        throw 'Undefined response'
      }

      const responseBody = (await response.json()) as {
        computerPosition: { row: number; col: number } | undefined
        possibilities: { row: number; col: number }[] | undefined
      }

      const { computerPosition, possibilities } = responseBody as {
        computerPosition: { row: number; col: number }
        possibilities: { row: number; col: number }[]
      }
      gridData[computerPosition.row][computerPosition.col] = computerSide

      client.execute(`
        let computerButton = document.getElementById('square-${computerPosition.row}-${computerPosition.col}')
        computerButton.innerHTML = '${computerSide}'
      `)

      const winner = checkWinner(gridData)
      if (winner) {
        console.log('Winner:', winner)
        const bannerText = winner === side ? 'You win!' : 'You lose :o'
        displayBanner(client, bannerText)
        return
      }

      const isDraw = checkDraw(gridData)
      if (isDraw) {
        console.log('Draw')
        displayBanner(client, 'Draw')
        return
      }

      client.set('grid-data', JSON.stringify(gridData))
      client.set('possibilities', JSON.stringify(possibilities))
    } catch (error) {
      console.log('Error while playing computer:', error)
      return
    }
  })

  manager.registerWidget(async () => {
    return await manager.useCache('widget', async () =>
      compiledTemplate({ stylesheet, initialGridData: initialGridData })
    )
  })
}
