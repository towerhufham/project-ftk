type Elemental = "Holy" | "Fire" | "Stone" | "Thunder" | "Plant" | "Wind" | "Water" | "Dark"

type Layer = "A" | "B" | "C" | "D"

// type ZoneType = "Hand" | "Deck" | "Field" | "GY" | "Deleted"

//making it an as const array instead of a union type makes it iteratable
const ALL_ZONES = [
  "Hand", "Deck", "Deleted",
  "Field-A", "Field-B", "Field-C", "Field-D",
  "GY-A", "GY-B", "GY-C", "GY-D"
] as const
type Zone = typeof ALL_ZONES[number]


type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Set<Elemental>
  level: number
  power: number
  flavor: string
  allowedLayers: {
    "A": boolean
    "B": boolean
    "C": boolean
    "D": boolean
  }
}

type CardInstance = CardDefinition & {
  iid: number
}

const instantiateCard = (definition: CardDefinition, iid: number): CardInstance => {
  return {
    ...definition, iid
  }
}

type BoardChange = {
  type: "Spawn Card"
  iid: number
  toZone: Zone
} | {
  type: "Move"
  iid: number
  //from might not be necessary, but seem helpful
  fromZone: Zone
  toZone: Zone
} | {
  type: "Change Elements"
  iid: number
  oldElements: Set<Elemental>
  newElements: Set<Elemental>
} | {
  type: "Change Level"
  iid: number
  oldLevel: number
  newLevel: number
} | {
  type: "Change Power"
  iid: number
  oldPower: number
  newPower: number
}

type GameState = {
  nextiid: number
  board: Record<Zone, CardInstance[]>
  moves: number
  history: BoardChange[]
}

const emptyBoard = (): Record<Zone, CardInstance[]> => {
  return {
    "Deck": [],
    "Hand": [],
    "Deleted": [],
    "Field-A": [],
    "Field-B": [],
    "Field-C": [],
    "Field-D": [],
    "GY-A": [],
    "GY-B": [],
    "GY-C": [],
    "GY-D": []
  }
}

const initGame = (decklist: CardDefinition[]): GameState => {
  //this bit was written by chat gpt, i didn't realize you could use reduce like that...
  const instances = decklist.reduce(
    (acc, definition, index) => [...acc, instantiateCard(definition, index)],
    [] as CardInstance[]
  )
  //TODO: shuffle
  return {
    nextiid: instances.length,
    board: {
      ...emptyBoard(),
      "Hand": instances.slice(0, 5),
      "Deck": instances.slice(5)
    },
    moves: 0,
    history: []
  }
}

//these two are almost identical, can probably do something here
const getCardInstance = (game: GameState, iid: number): CardInstance => {
  for (const zone of ALL_ZONES) {
    for (const card of game.board[zone]) {
      if (card.iid === iid) return card
    }
  }
  throw new Error(`GAME ERROR: Can't find card with iid ${iid}`)
}
const getCardZone = (game: GameState, iid: number): Zone => {
  for (const zone of ALL_ZONES) {
    for (const card of game.board[zone]) {
      if (card.iid === iid) return zone
    }
  }
  throw new Error(`GAME ERROR: Can't find zone of card with iid ${iid}`)
}

const moveCard = (game: GameState, iid: number, to: Zone): GameState => {
  const card = getCardInstance(game, iid)
  const from = getCardZone(game, iid)
  const newBoard = {
    ...game.board,
    [from]: game.board[from].filter(card => card.iid !== iid),
    [to]: [...game.board[to], card]
  }
  return {
    ...game, 
    board: newBoard
  }
}

const spawnCardIntoGame = (game: GameState, definition: CardDefinition, zone: Zone): GameState => {
  const instance = instantiateCard(definition, game.nextiid)
  const board = {
    ...game.board, 
    [zone]: [...game.board[zone], instance]
  }
  return {
    ...game,
    nextiid: game.nextiid + 1,
    board
  }
}


//---------------------------------------

export const TEST_GAME = () => {
  const def1: CardDefinition = {
    name: "Alpha",
    collectionNumber: 0,
    elements: new Set(["Fire"]),
    level: 1,
    power: 100,
    allowedLayers: {
      "A": true,
      "B": false,
      "C": false,
      "D": false
    },
    flavor: "Alpha test go!"
  } 
  const def2: CardDefinition = {
    name: "Beta",
    collectionNumber: 1,
    elements: new Set(["Water"]),
    level: 3,
    power: 200,
    allowedLayers: {
      "A": true,
      "B": true,
      "C": false,
      "D": false
    },
    flavor: "Beta test go!!"
  }

  let game = initGame([
    def1, def1, def1, def1, def1, 
    def2, def2, def2, def2, def2
  ])

  game = moveCard(game, 7, "Field-A")
  game = spawnCardIntoGame(game, def2, "GY-B")

  console.dir(game)
}