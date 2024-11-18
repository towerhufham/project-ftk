import type { CardDefinition, CardInstance, GameState, StateChange } from "./game"
import { getCardZone } from "./game"

import { moveTargetsToZone } from "./ability"

//----------------- DEBUG CARDS -----------------//



//----------------- LINEAR ALGEBRA ANGELS? -----------------//

export const pemi: CardDefinition = {
  name: "Pemi, the Fairyguide",
  collectionNumber: 1,
  bgGradient: ["#ffffff", "#FFFFC5"],
  abilities: [{
    description: "Summon this.",
    limitPerTurn: 1,
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    getStateChanges: () => []
  }, {
    description: "1 Holy → Send this to the GY to search a 'Fairy' to your hand.",
    limitPerTurn: 1,
    onlyFrom: "Field",
    sendTo: "GY",
    activationType: {type: "Manual"},
    targeting: {
      canSelfTarget: false,
      isCardValidTarget: (game, thisCard, target) => {
        return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Fairy"))
      }
    },
    resourceCost: [{resource: "Holy", amount: 1}],
    getStateChanges: moveTargetsToZone("Hand")
  }],
  flavor: "Bweeeooo"
}

export const fairy1: CardDefinition = {
  name: "Column Fairy",
  collectionNumber: 2,
  bgGradient: ["#ffffff", "#90EE90"],
  abilities: [{
    description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
    limitPerTurn: "Unlimited",
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    condition: (game) => {
      return (game.board.Field.length < 3)
    },
    getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
  }],
  flavor: "It perches on the columns"
}

export const fairy2: CardDefinition = {
  name: "Row Fairy",
  collectionNumber: 3,
  bgGradient: ["#ffffff", "#FF6961"],
  abilities: [{
    description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
    limitPerTurn: "Unlimited",
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    condition: (game) => {
      return (game.board.Field.length < 3)
    },
    getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
  }],
  flavor: "It flies low to the cloudy puffs and the golden ground"
}

export const fairy3: CardDefinition = {
  name: "Diagonal Fairy",
  collectionNumber: 4,
  bgGradient: ["#ffffff", "#ADD8E6"],
  abilities: [{
    description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
    limitPerTurn: "Unlimited",
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    condition: (game) => {
      return (game.board.Field.length < 3)
    },
    getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
  }],
  flavor: "They can be seen descending from high up in groups"
}