//todo: use CardInstance instead of iid in most functions
//todo: make the arguments for effects a single object 
//todo: isAbilityActivatable shouldn't return a string because strings and truthy, or rather, it should return an "OK" string

export type Elemental = "Holy" | "Fire" | "Stone" | "Thunder" | "Plant" | "Wind" | "Water" | "Dark" | "Cyber" | "Space"

// type ZoneType = "Hand" | "Deck" | "Field" | "GY" | "Deleted"

//making it an as const array instead of a union type makes it iteratable
const ALL_ZONES = ["Hand", "Deck", "Deleted", "Field", "GY"] as const
export type Zone = typeof ALL_ZONES[number]


export type Ability = {
  name: string,
  limitPerTurn: number | "Unlimited"
  onlyFrom?: Zone
  sendTo?: Zone //this is just a helper, could do it with a StateChange
  condition?: (game: GameState, card: CardInstance) => boolean
  targeting?: {
    //for now assume only 1 target
    //todo: multitarget
    isCardValidTarget: (game: GameState, thisCard: CardInstance, target: CardInstance) => boolean
    canSelfTarget: boolean //might not be that useful
  }
  getStateChanges: (game: GameState, card: CardInstance, targetCards: CardInstance[]) => StateChange[]
} 

export type CardDefinition = {
  collectionNumber: number
  name: string
  elements: Set<Elemental>
  level: number
  abilities: Ability[]
  power: number
  flavor: string
}

export type CardInstance = CardDefinition & {
  //instance iid, should be unique within a game object
  iid: number
  //keeps track of how many times an ability has been used this turn
  abilityUses: number[]
}

const instantiateCard = (definition: CardDefinition, iid: number): CardInstance => {
  const abilityUses = definition.abilities.map(_ => 0)
  return {
    ...definition, iid, abilityUses
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
    "Field": [],
    "GY": [],
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
export const getCardZone = (game: GameState, iid: number): Zone => {
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
  console.log(`moving iid ${iid} from ${from} to ${to}`)
  //if we're trying to move the card to the same zone it's in, don't do anything
  if (from === to) return game
  //otherwise, remove it from the old zone and put it in the new one
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

const getAbilityUses = (game: GameState, iid: number, ability: Ability): number => {
  const card = getCardInstance(game, iid)
  const index = card.abilities.findIndex(a => a === ability)
  return card.abilityUses[index]
}
const incrementAbilityUse = (game: GameState, iid: number, ability: Ability): GameState => {
  const card = getCardInstance(game, iid)
  const index = card.abilities.findIndex(a => a === ability)
  const newCount = card.abilityUses[index] + 1
  const newAbilityUses = card.abilityUses.map((element, i) => {
    return (i === index) ? newCount : element
  })
  return editCardInstance(game, iid, "abilityUses", newAbilityUses)
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

const getAllCards = (game: GameState): CardInstance[] => {
  return ALL_ZONES.reduce((acc, zone) => [...acc, ...game.board[zone]], [] as CardInstance[])
}

export const getValidAbilityTargets = (game: GameState, card: CardInstance, ability: Ability): CardInstance[] => {
  if (!ability.targeting) throw new Error("GAME ERROR: Trying to get valid targets of an ability with no getCardTargets()")
  const valid = getAllCards(game).filter(c => ability.targeting!.isCardValidTarget!(game, card, c))
  return (ability.targeting.canSelfTarget) ? valid : valid.filter(c => c !== card)
}

export const isAbilityActivatable = (game: GameState, card: CardInstance, ability: Ability): true | string => {
  //If it can't be activated, it returns a string saying why
  if (typeof ability.limitPerTurn === "number" && getAbilityUses(game, card.iid, ability) >= ability.limitPerTurn) return "Hit ability limit for this turn"
  if (ability.condition && !ability.condition(game, card)) return "Card condition not met"
  if (ability.onlyFrom && getCardZone(game, card.iid) !== ability.onlyFrom) return "Card not in the right zone"
  if (ability.targeting && getValidAbilityTargets(game, card, ability).length === 0) return "Ability has no valid targets"
  //todo: check for valid targets (and if there are none, return an error string)
  return true
}

export const applyEffect = (game: GameState, card: CardInstance, ability: Ability, targets: CardInstance[]): GameState => {
  if (isAbilityActivatable(game, card, ability) !== true) throw new Error ("GAME ERROR: calling applyEffect() on an ability that doesn't pass isAbilityActivatable()!")
  //todo: plug targets into function (replacing the [])
  const stateChanges = ability.getStateChanges(game, card, targets)
  //if the ability has a sendTo, add it to the changes
  const withSendTo = ability.sendTo ? applyStateChanges(game, [...stateChanges, {type: "Move Card", iid: card.iid, toZone: ability.sendTo}])
                                    : applyStateChanges(game, stateChanges)
  const result = incrementAbilityUse(withSendTo, card.iid, ability)
  return {
    ...result,
    moves: game.moves + 1,
    history: [...game.history, ...stateChanges]
  }
}
