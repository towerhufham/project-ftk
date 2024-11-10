//todo: use CardInstance instead of iid in most functions (not a big deal though)
//todo: make the arguments for effects a single object?

import { shuffle } from "./utils"

export type Elemental = "Holy" | "Fire" | "Stone" | "Thunder" | "Plant" | "Wind" | "Water" | "Dark" | "Cyber" | "Space"

//making it an as const array instead of a union type makes it iteratable
const ALL_ZONES = ["Hand", "Deck", "Deleted", "Field", "GY"] as const
export type Zone = typeof ALL_ZONES[number]

export type Ability = {
  description: string
  minLevel: number
  limitPerTurn: number | "Unlimited"
  onlyFrom?: Zone
  sendTo?: Zone //this is just a helper, could do it with a StateChange
  activationType: {type: "Manual"} | {
    type: "Zone Trigger"
    zone: Zone
  }
  condition?: (game: GameState, card: CardInstance) => boolean
  targeting?: {
    //for now assume only 1 target
    //todo: multitarget
    //notice that the arguments for this function and getStateChanges are almost identical
    isCardValidTarget: (game: GameState, thisCard: CardInstance, target: CardInstance) => boolean
    canSelfTarget: boolean //might not be that useful, could be optional
    // todo: requiredTargetZone (optional)
    // todo: canTargetWithSameName (would be part of the above I guess)
    // todo: theres an opportunity for a hook in the effect logic, since the same logic will usually always be applied equally to each target
    // todo: simple "target must be" field with a partial of a CardInstance (get gpt to help write this)

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
  stateChangeQueue: StateChange[]
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
  const shuffledInstances = shuffle(instances)
  return {
    nextiid: shuffledInstances.length,
    board: {
      ...emptyBoard(),
      "Hand": shuffledInstances.slice(0, 5),
      "Deck": shuffledInstances.slice(5)
    },
    moves: 0,
    history: [],
    interactionState: {type: "Standby"},
    stateChangeQueue: []
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
  //todo: preserve the order of cards (by iid)
  const card = getCardInstance(game, iid)
  const zone = getCardZone(game, iid)
  const newCard = {
    ...card,
    [key]: val
  }
  //chat gpt helped me figure out how to preserve the card's position in the array
  //to prevent weird visual jumps
  const originalZoneCards = game.board[zone]
  const cardIndex = originalZoneCards.findIndex(c => c.iid === iid)
  const newZoneCards = [
    ...originalZoneCards.slice(0, cardIndex),
    newCard,
    ...originalZoneCards.slice(cardIndex + 1),
  ]
  const newBoard = {
    ...game.board,
    [zone]: newZoneCards,
  }
  return {
    ...game,
    board: newBoard
  }
}

const getAllCards = (game: GameState): CardInstance[] => {
  return ALL_ZONES.reduce((acc, zone) => [...acc, ...game.board[zone]], [] as CardInstance[])
}

export const getValidAbilityTargets = (game: GameState, card: CardInstance, ability: Ability): CardInstance[] => {
  if (!ability.targeting) throw new Error("GAME ERROR: Trying to get valid targets of an ability with no getCardTargets()")
  const valid = getAllCards(game).filter(c => ability.targeting!.isCardValidTarget!(game, card, c))
  return (ability.targeting.canSelfTarget) ? valid : valid.filter(c => c !== card)
}

type ActivationResult = "OK" | "Hit ability limit for this turn" | "Card condition not met" 
  | "Card not in the right zone" | "Ability has no valid targets" | "Card not high enough level"

export const isAbilityActivatable = (game: GameState, card: CardInstance, ability: Ability): ActivationResult => {
  //If it can't be activated, it returns a string saying why
  //todo: maybe check for multiple reasons it can't be activated?
  if (typeof ability.limitPerTurn === "number" && getAbilityUses(game, card.iid, ability) >= ability.limitPerTurn) return "Hit ability limit for this turn"
  if (card.level < ability.minLevel) return "Card not high enough level"
  if (ability.condition && !ability.condition(game, card)) return "Card condition not met"
  if (ability.onlyFrom && getCardZone(game, card.iid) !== ability.onlyFrom) return "Card not in the right zone"
  if (ability.targeting && getValidAbilityTargets(game, card, ability).length === 0) return "Ability has no valid targets"
  return "OK"
}

export const applyManualEffect = (game: GameState, card: CardInstance, ability: Ability, targets: CardInstance[]): GameState => {
  if (isAbilityActivatable(game, card, ability) !== "OK") throw new Error ("GAME ERROR: calling applyEffect() on an ability that doesn't pass isAbilityActivatable()!")
  if (ability.activationType.type !== "Manual") throw new Error (`GAME ERROR: Calling applyManualEffect on mon-manual ability '${ability.description}'`)
  const stateChanges = ability.getStateChanges(game, card, targets)
  //if the ability has a sendTo, add it to the changes
  const fullStateChanges: StateChange[] = ability.sendTo ? [...stateChanges, {type: "Move Card", iid: card.iid, toZone: ability.sendTo}] : stateChanges
  //WORKING
  const updatedQueue = addStateChangesToQueue(game, fullStateChanges)
  const updatedGame = workThroughStateChangeQueue(updatedQueue)
  const result = incrementAbilityUse(updatedGame, card.iid, ability)
  return {
    ...result,
    moves: game.moves + 1,
    history: [...game.history, ...stateChanges]
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

const checkForMoveTriggers = (game: GameState, card: CardInstance, to: Zone): Ability[] => {
  //this is called when the card moves zone
  //if multiple triggers could be activated, return them all
  return card.abilities.filter(
    a => a.activationType.type === "Zone Trigger" 
    && a.activationType.zone === to 
    && isAbilityActivatable(game, card, a) === "OK")
}

const applyTopStateChange = (gameWithFullQueue: GameState): GameState => {
  //todo: this probably needs some refactoring
  //pop the first change off the queue
  const sc = gameWithFullQueue.stateChangeQueue[0]
  const game = {
    ...gameWithFullQueue,
    stateChangeQueue: gameWithFullQueue.stateChangeQueue.slice(1)
  }
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
      const newGame =  moveCard(game, sc.iid, sc.toZone)
      const card = getCardInstance(newGame, sc.iid) 
      //check for triggers
      const triggers = checkForMoveTriggers(newGame, card, sc.toZone)
      //TODO: make sendTo work (need to extract some logic from applyManualEffect, probably not a biggie)
      //TODO: set up targeting (will need to use game.interactionState)
      const triggerChanges = triggers.reduce((changes, trigger) => [...changes, ...trigger.getStateChanges(newGame, card, [])], [] as StateChange[])
      console.log(triggerChanges)
      return addStateChangesToQueue(newGame, triggerChanges)
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

const addStateChangesToQueue = (game: GameState, changes: StateChange[]): GameState => {
  //failsafe for uncontrollable, automatically infinite combos
  if ([...changes, ...game.stateChangeQueue].length > 100) {
    console.log("GAME WARNING: 100+ StateChanges trying to be added to the queue, aborting!")
    return game
    //TODO: this won't work until there's a kind of "lockdown" boolean on GameState to prevent adding more SCs after it lowers back down < 100
  }
  return {
    ...game,
    stateChangeQueue: [...changes, ...game.stateChangeQueue]
  }
}

export const workThroughStateChangeQueue = (game: GameState): GameState => {
  if (game.stateChangeQueue.length === 0) return game
  const newGame = applyTopStateChange(game)
  //todo: check for triggers, will need to use game.interactionState
  return workThroughStateChangeQueue(newGame)
}