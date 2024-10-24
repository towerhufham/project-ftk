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


type Ability = {
  name: string,
  limit: "Unlimited" | "OPT" | "Hard OPT"
  condition?: (game: GameState, card: CardInstance) => boolean
  getCardTargets?: (game: GameState, card: CardInstance) => CardInstance[]
  // getZoneTargets?: (game: GameState, card: CardInstance) => Zone[]
  //can include targetZones as an argument when we get there
  getStateChanges: (game: GameState, card: CardInstance, targetCards: CardInstance[]) => StateChange[]
} 

type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Set<Elemental>
  level: number
  allowedLayers: {
    "A": boolean
    "B": boolean
    "C": boolean
    "D": boolean
  }
  abilities: Ability[]
  power: number
  flavor: string
}

type CardInstance = CardDefinition & {
  iid: number
}

const instantiateCard = (definition: CardDefinition, iid: number): CardInstance => {
  return {
    ...definition, iid
  }
}

type StateChange = {
  type: "Draw Card"
} | {
  type: "Spawn Card"
  definition: CardDefinition
  toZone: Zone
} | {
  type: "Move Card"
  iid: number
  toZone: Zone
} | {
  type: "Change Elements"
  iid: number
  newElements: Set<Elemental>
} | {
  type: "Change Level"
  iid: number
  newLevel: number
} | {
  type: "Change Power"
  iid: number
  newPower: number
}

type GameState = {
  nextiid: number
  board: Record<Zone, CardInstance[]>
  moves: number
  history: StateChange[]
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
  const newBoard = {
    ...game.board, 
    [zone]: [...game.board[zone], instance]
  }
  return {
    ...game,
    nextiid: game.nextiid + 1,
    board: newBoard
  }
}

const editCardInstance = (game: GameState, iid: number, key: string, val: unknown): GameState => {
  //only changes one attribute at a time
  //the val isn't typechecked!
  const card = getCardInstance(game, iid)
  const zone = getCardZone(game, iid)
  const newCard = {
    ...card,
    [key]: val
  }
  const newBoard = {
    ...game.board,
    [zone]: [...game.board[zone].filter(c => c.iid !== iid), newCard]
  }
  return {
    ...game,
    board: newBoard
  }
}

const applyStateChange = (game: GameState, sc: StateChange): GameState => {
  switch (sc.type) {
    case "Draw Card": {
      if (game.board.Deck.length < 1) return game 
      const topDeck = game.board.Deck[0].iid
      return moveCard(game, topDeck, "Hand")
    }
    case "Spawn Card": {
      return spawnCardIntoGame(game, sc.definition, sc.toZone)
    }
    case "Move Card": {
      return moveCard(game, sc.iid, sc.toZone)
    }
    case "Change Elements": {
      return editCardInstance(game, sc.iid, "elements", sc.newElements)
    }
    case "Change Level": {
      return editCardInstance(game, sc.iid, "level", sc.newLevel)
    }
    case "Change Power": {
      return editCardInstance(game, sc.iid, "power", sc.newPower)
    }
  }
}

const applyStateChanges = (game: GameState, changes: StateChange[]): GameState => {
  //simple helper
  return changes.reduce((state, stateChange) => applyStateChange(state, stateChange), game)
}

const applyEffect = (game: GameState, card: CardInstance, ability: Ability): GameState => {
  //todo: plugging in targets, verifying conditions
  return applyStateChanges(game, ability.getStateChanges(game, card, []))
}

//---------------------------------------

export const TEST_GAME = () => {
  const def1: CardDefinition = {
    name: "Alpha",
    collectionNumber: 0,
    elements: new Set(["Fire"]),
    level: 1,
    abilities: [{
      name: "Draw 1",
      limit: "OPT",
      getStateChanges: () => [{type: "Draw Card"}]
    }],
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
    abilities: [{
      name: "Draw 2",
      limit: "OPT",
      getStateChanges: () => [{type: "Draw Card"}, {type: "Draw Card"}]
    }],
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
    def2, def2, def2, def2, def2,
    def1, def1, def1, def1, def1, 
  ])

  // game = moveCard(game, 7, "Field-A")
  // game = spawnCardIntoGame(game, def2, "GY-B")
  const grabbyCard = game.board.Hand[0]
  game = applyEffect(game, grabbyCard, grabbyCard.abilities[0])

  console.dir(game)
}