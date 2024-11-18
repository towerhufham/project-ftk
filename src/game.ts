//todo: use CardInstance instead of iid in most functions (not a big deal though)
//todo: make the arguments for effects a single object?
//todo: make archetype searching case-insensitive

import { shuffle } from "./utils"

export type Resource = "Holy" | "Fire" | "Stone" | "Thunder" | "Plant" | "Wind" | "Water" | "Dark" | "Cyber" | "Space"

//making it an as const array instead of a union type makes it iteratable
const ALL_ZONES = ["Hand", "Deck", "Deleted", "Field", "GY"] as const
export type Zone = typeof ALL_ZONES[number]

export type Ability = {
  description: string
  limitPerTurn: number | "Unlimited"
  onlyFrom?: Zone
  sendTo?: Zone //this is just a helper, could do it with a StateChange
  activationType: {
    type: "Manual"
  } | {
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
  resourceCost?: {resource: Resource, amount: number}[]
  getStateChanges: (ctx: AbilityContext) => StateChange[]
} 

export type AbilityContext = {
  game: GameState
  card: CardInstance
  targets: CardInstance[]
}

export type CardDefinition = {
  collectionNumber: number
  name: string
  bgGradient: string[]
  abilities: Ability[]
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
  type: "Add Resource",
  resource: Resource,
  amount: number
} | {
  type: "Subtract Resource",
  resource: Resource,
  amount: number
}
// | {
//   type: "Change Elements"
//   iid: number
//   newElements: Set<Resource>
// } | {
//   type: "Level Up"
//   iid: number
// } | {
//   type: "Change Power"
//   iid: number
//   newPower: number
// }

export type GameState = {
  nextiid: number
  board: Record<Zone, CardInstance[]>
  resources: Record<Resource, number>
  moves: number
  history: StateChange[]
  interactionState: {type: "Standby"} | {type: "Targeting", card: CardInstance, ability: Ability}
  stateChangeQueue: StateChange[]
  triggerQueue: {ability: Ability, card: CardInstance}[]
  triggerCount: number
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

const emptyResources = (): Record<Resource, number> => {
  return {
    "Holy": 0,
    "Fire": 0,
    "Stone": 0,
    "Thunder": 0,
    "Plant": 0,
    "Wind": 0,
    "Water": 0,
    "Dark": 0,
    "Cyber": 0,
    "Space": 0
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
    resources: emptyResources(),
    moves: 0,
    history: [],
    interactionState: {type: "Standby"},
    stateChangeQueue: [],
    triggerQueue: [],
    triggerCount: 0
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

const canPayResourceCost = (game: GameState, costs: {resource: Resource, amount: number}[]) => {
  return costs.every(c => game.resources[c.resource] >= c.amount)
}

type ActivationResult = "OK" | "Hit ability limit for this turn" | "Card condition not met" 
  | "Card not in the right zone" | "Ability has no valid targets" | "Can't pay resource cost"

export const isAbilityActivatable = (game: GameState, card: CardInstance, ability: Ability): ActivationResult => {
  //If it can't be activated, it returns a string saying why
  //todo: maybe check for multiple reasons it can't be activated?
  if (typeof ability.limitPerTurn === "number" && getAbilityUses(game, card.iid, ability) >= ability.limitPerTurn) return "Hit ability limit for this turn"
  // if (card.level < ability.minLevel) return "Card not high enough level"
  if (ability.onlyFrom && getCardZone(game, card.iid) !== ability.onlyFrom) return "Card not in the right zone"
  if (ability.condition && !ability.condition(game, card)) return "Card condition not met"
  if (ability.resourceCost && !canPayResourceCost(game, ability.resourceCost)) return "Can't pay resource cost"
  if (ability.targeting && getValidAbilityTargets(game, card, ability).length === 0) return "Ability has no valid targets"
  return "OK"
}

export const getFullStateChanges = (ability: Ability, ctx: AbilityContext): StateChange[] => {
  //adds sendTo logic, might do more later
  const stateChanges = ability.getStateChanges(ctx)
  const costChanges = ability.resourceCost 
    ?  ability.resourceCost.map(c => {return {type: "Subtract Resource", resource: c.resource, amount: c.amount} as StateChange})
    : [] 
  const withResourceCosts = [
    ...costChanges,
    ...stateChanges
  ]
  return ability.sendTo ? [...withResourceCosts, {type: "Move Card", iid: ctx.card.iid, toZone: ability.sendTo}] : withResourceCosts
}

export const applyManualEffect = (game: GameState, card: CardInstance, ability: Ability, targets: CardInstance[]): GameState => {
  if (isAbilityActivatable(game, card, ability) !== "OK") throw new Error ("GAME ERROR: calling applyEffect() on an ability that doesn't pass isAbilityActivatable()!")
  if (ability.activationType.type !== "Manual") throw new Error (`GAME ERROR: Calling applyManualEffect on mon-manual ability '${ability.description}'`)
  const stateChanges = getFullStateChanges(ability, {game, card, targets})
  const updatedQueue = addStateChangesToQueue(game, stateChanges)
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
      const triggersWithCards = triggers.map(t => {return {ability: t, card}})
      return {
        ...newGame,
        triggerQueue: [...newGame.triggerQueue, ...triggersWithCards],
        triggerCount: newGame.triggerCount + triggers.length
      }
    }
    case "Subtract Resource": {
      return {
        ...game,
        resources: {
          ...game.resources,
          [sc.resource]: game.resources[sc.resource] - sc.amount
        }
      }
    }
    case "Add Resource": {
      return {
        ...game,
        resources: {
          ...game.resources,
          [sc.resource]: game.resources[sc.resource] + sc.amount
        }
      }
    }
    // case "Change Elements": {
    //   return editCardInstance(game, sc.iid, "elements", sc.newElements)
    // }
    // case "Level Up": {
    //   const card = getCardInstance(game, sc.iid) 
    //   return editCardInstance(game, sc.iid, "level", card.level + 1)
    // }
    // case "Change Power": {
    //   return editCardInstance(game, sc.iid, "power", sc.newPower)
    // }
  }
}

const addStateChangesToQueue = (game: GameState, changes: StateChange[]): GameState => {
  //failsafe for uncontrollable, automatically infinite combos
  if (game.triggerCount > 100) {
    console.log("triggerCount length has gone over 100, no new state changes can be added!")
    return game
  }
  return {
    ...game,
    stateChangeQueue: [...changes, ...game.stateChangeQueue]
  }
}

export const workThroughStateChangeQueue = (game: GameState): GameState => {
  let currentGame = game
  let exit = false
  while (currentGame.stateChangeQueue.length > 0) {
    currentGame = applyTopStateChange(currentGame)
    while (currentGame.triggerQueue.length > 0) {
      //pop the first trigger off the queue
      const trigger = currentGame.triggerQueue[0]
      //todo: check for targeting triggers, will need to use currentGame.interactionState
      if (trigger.ability.targeting) {
        console.log("trigger needs targets")
        exit = true
        break
      }
      const triggerChanges = getFullStateChanges(trigger.ability, {game: currentGame, card: trigger.card, targets: []})
      const newGame = addStateChangesToQueue(currentGame, triggerChanges)
      currentGame = {
        ...newGame,
        triggerQueue: currentGame.triggerQueue.slice(1)
      }
    }
    if (exit) {
      //pass to ui to declare targets
      const ability = currentGame.triggerQueue[0]!.ability
      const card = currentGame.triggerQueue[0]!.card
      return {
        ...currentGame,
        interactionState: {type: "Targeting", card, ability}
      }
    }
  }
  return {
    ...currentGame,
    interactionState: {type: "Standby"}
  }
}

export const resumeTopTriggerWithTargets = (game: GameState, targets: CardInstance[]): GameState => {
  if (game.triggerQueue.length < 1) throw new Error ("GAME ERROR: called resumeTopTriggerWithTargets() while trigger queue is empty!")
  const ability = game.triggerQueue[0].ability
  const card = game.triggerQueue[0].card
  if (!ability.targeting) throw new Error (`GAME ERROR: called resumeTopTriggerWithTargets() even though trigger doesn't target: ${ability.description}`)
  //the below is basically copy pasta from workThroughStateChangeQueue(), room for extraction prolly
  const triggerChanges = getFullStateChanges(ability, {game, card, targets})
  const newGame = addStateChangesToQueue(game, triggerChanges)
  return workThroughStateChangeQueue({
    ...newGame,
    triggerQueue: newGame.triggerQueue.slice(1)
  })
}