export type Elemental = "Holy" | "Fire" | "Stone" | "Thunder" | "Plant" | "Wind" | "Water" | "Dark"

export type Layer = "A" | "B" | "C" | "D"

export type LayerGroup = {
  "A": boolean,
  "B": boolean,
  "C": boolean,
  "D": boolean
}

// type ZoneType = "Hand" | "Deck" | "Field" | "GY" | "Deleted"

//making it an as const array instead of a union type makes it iteratable
const ALL_ZONES = [
  "Hand", "Deck", "Deleted",
  "Field-A", "Field-B", "Field-C", "Field-D",
  "GY-A", "GY-B", "GY-C", "GY-D"
] as const
export type Zone = typeof ALL_ZONES[number]


export type Ability = {
  name: string,
  limit: "Unlimited" | "OPT" | "Hard OPT"
  onlyFrom?: Zone // | "Any Field" | "Any GY"
  sendTo?: Zone //this is just a helper, could do it with a StateChange
  condition?: (game: GameState, card: CardInstance) => boolean
  getCardTargets?: (game: GameState, card: CardInstance) => CardInstance[]
  // getZoneTargets?: (game: GameState, card: CardInstance) => Zone[]
  //can include targetZones as an argument when we get there
  getStateChanges: (game: GameState, card: CardInstance, targetCards: CardInstance[]) => StateChange[]
} 

export type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Set<Elemental>
  level: number
  allowedLayers: LayerGroup
  abilities: Ability[]
  power: number
  flavor: string
}

export type CardInstance = CardDefinition & {
  iid: number
}

const instantiateCard = (definition: CardDefinition, iid: number): CardInstance => {
  return {
    ...definition, iid
  }
}

export type StateChange = {
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

export type GameState = {
  nextiid: number
  board: Record<Zone, CardInstance[]>
  moves: number
  history: StateChange[]
  interactionState: {type: "Standby"} | {type: "Targeting", card: CardInstance, ability: Ability}
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

export const initGame = (decklist: CardDefinition[]): GameState => {
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
    history: [],
    interactionState: {type: "Standby"}
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

export const moveCard = (game: GameState, iid: number, to: Zone): GameState => {
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

export const spawnCardIntoGame = (game: GameState, definition: CardDefinition, zone: Zone): GameState => {
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

export const isAbilityActivatable = (game: GameState, card: CardInstance, ability: Ability): true | string => {
  //If it can't be activated, it returns a string saying why
  if (ability.condition && !ability.condition(game, card)) return "Card condition not met"
  if (ability.onlyFrom && getCardZone(game, card.iid) !== ability.onlyFrom) return "Card not in the right zone"
  //todo: check for valid targets (and if there are none, return an error string)
  return true
}

export const applyEffect = (game: GameState, card: CardInstance, ability: Ability): GameState => {
  if (isAbilityActivatable(game, card, ability) !== true) throw new Error ("GAME ERROR: calling applyEffect() on an ability that doesn't pass isAbilityActivatable()!")
  //todo: plug targets into function (replacing the [])
  const stateChanges = ability.getStateChanges(game, card, [])
  //if the ability has a sendTo, add it to the changes
  const result = ability.sendTo ? applyStateChanges(game, [...stateChanges, {type: "Move Card", iid: card.iid, toZone: ability.sendTo}])
                                : applyStateChanges(game, stateChanges)
  return {
    ...result,
    moves: game.moves + 1,
    history: [...game.history, ...stateChanges]
  }
}
