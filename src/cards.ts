import type { CardDefinition, CardInstance, GameState, StateChange } from "./game"
import { getCardZone } from "./game"

import { moveTargetsToZone } from "./ability"

//----------------- TESTING CARDS -----------------//

export const def1: CardDefinition = {
  name: "Alpha",
  collectionNumber: 0,
  bgGradient: [],
  abilities: [{
    description: "Search Any From Deck",
    limitPerTurn: 1,
    sendTo: "GY",
    activationType: {type: "Manual"},
    targeting: {
      canSelfTarget: false,
      isCardValidTarget: (game: GameState, thisCard: CardInstance, target: CardInstance) => {
        return (getCardZone(game, target.iid) === "Deck")
      }
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Hand"}})
    }
  }, {
    description: "When this enters the GY, search 1 card and then delete this.",
    limitPerTurn: 1,
    activationType: {type: "Zone Trigger", zone: "GY"},
    sendTo: "Deleted",
    targeting: {
      canSelfTarget: false,
      isCardValidTarget: (game, thisCard, target) => {
        return (getCardZone(game, target.iid) === "Deck")
      },
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Hand"}})
    }
  }],
  flavor: "Alpha test go!"
} 
export const def2: CardDefinition = {
  name: "Beta",
  collectionNumber: 1,
  bgGradient: [],
  abilities: [{
    description: "Summon",
    limitPerTurn: 1,
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    getStateChanges: () => []
  },
  {
    description: "Draw 2",
    limitPerTurn: 1,
    onlyFrom: "Field",
    activationType: {type: "Manual"},
    getStateChanges: () => [{type: "Draw Card"}, {type: "Draw Card"}]
  }],
  flavor: "Beta test go!!"
}


//----------------- RAIDRAPTORS -----------------//

export const rr1: CardDefinition = {
  name: "Raidraptor - Tribute Lanius",
  collectionNumber: 1,
  bgGradient: [],
  abilities: [{
    description: "Summon this and send a Raidraptor from your Deck to the GY",
    limitPerTurn: 1,
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    targeting: {
      canSelfTarget: false,
      isCardValidTarget: (game, thisCard, target) => {
        return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Raidraptor"))
      }
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "GY"}})
    }
  }],
  flavor: "rr1"
}

// export const rr2: CardDefinition = {
//   name: "Raidraptor - Mimicry Lanius",
//   collectionNumber: 2,
//   level: 2,
//   abilities: [{
//     description: "When this enters the field, all Raidraptor cards that were already on the field level up.",
//     minLevel: 1,
//     limitPerTurn: 1,
//     activationType: {type: "Zone Trigger", zone: "Field"},
//     getStateChanges: (ctx) => {
//       const rrOnField = ctx.game.board.Field.filter(c => c.name.includes("Raidraptor"))
//       return rrOnField.map(c => { return {type: "Level Up", iid: c.iid}})
//     }
//   }, {
//     description: "Delete this from the GY, search 1 Raidraptor",
//     minLevel: 1,
//     limitPerTurn: 1,
//     activationType: {type: "Manual"},
//     onlyFrom: "GY",
//     sendTo: "Deleted",
//     targeting: {
//       canSelfTarget: false,
//       isCardValidTarget: (game, thisCard, target) => {
//         return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Raidraptor"))
//       }
//     },
//     getStateChanges: (ctx) => {
//       return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Hand"}})
//     }
//   }],
//   flavor: "rr2"
// }

// export const rr3: CardDefinition = {
//   name: "Raidraptor - Strangle Lanius",
//   collectionNumber: 3,
//   abilities: [{
//     description: "Summon this if there is a Dark card on the field.",
//     minLevel: 1,
//     limitPerTurn: 1,
//     activationType: {type: "Manual"},
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     condition: (game) => {
//       return game.board.Field.some(c => c.elements.has("Dark"))
//     },
//     getStateChanges: () => []
//   }],
//   flavor: "rr3"
// }

export const rr4: CardDefinition = {
  name: "Raidraptor - Bloom Vulture",
  collectionNumber: 4,
  bgGradient: [],
  abilities: [{
    description: "If there are no cards on the field, summon this and target Raidraptor from your hand.",
    limitPerTurn: 1,
    activationType: {type: "Manual"},
    onlyFrom: "Hand",
    sendTo: "Field",
    targeting: {
      canSelfTarget: false, //the first ability where this is actually important
      isCardValidTarget: (game, thisCard, target) => {
        return (getCardZone(game, target.iid) === "Hand" && target.name.includes("Raidraptor"))
      }
    },
    condition: (game) => {
      return (game.board.Field.length === 0)
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Field"}})
    }
  }, {
    description: "If this is in the GY and there are no cards on the field, summon this and another target Raidraptor from the GY.",
    limitPerTurn: 1,
    activationType: {type: "Manual"},
    onlyFrom: "GY",
    sendTo: "Field",
    targeting: {
      canSelfTarget: false,
      isCardValidTarget: (game, thisCard, target) => {
        //first use of thisCard
        return (getCardZone(game, target.iid) === "GY" && target.name.includes("Raidraptor") && target.iid !== thisCard.iid)
      }
    },
    condition: (game) => {
      return (game.board.Field.length === 0)
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Field"}})
    }
  }],
  flavor: "rr4"
}

export const rr5: CardDefinition = {
  name: "Raidraptor - Noir Lanius",
  collectionNumber: 4,
  bgGradient: [],
  abilities: [{
    description: "If there are no cards on the field, summon this and target Raidraptor from your hand.",
    limitPerTurn: 1,
    activationType: {type: "Manual"},
    onlyFrom: "Hand",
    sendTo: "Field",
    targeting: {
      canSelfTarget: false, //the first ability where this is actually important
      isCardValidTarget: (game, thisCard, target) => {
        return (getCardZone(game, target.iid) === "Hand" && target.name.includes("Raidraptor"))
      }
    },
    condition: (game) => {
      return (game.board.Field.length === 0)
    },
    getStateChanges: (ctx) => {
      return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: "Field"}})
    }
  }],
  flavor: "rr4"
}

export const rr7: CardDefinition = {
  name: "Raidraptor - Heel Eagle",
  collectionNumber: 7,
  bgGradient: [],
  abilities: [{
    description: "Summon this if all monsters on the field are Raidraptors (minimum 1)",
    limitPerTurn: 1,
    onlyFrom: "Hand",
    sendTo: "Field",
    activationType: {type: "Manual"},
    condition: (game) => {
      return (game.board.Field.length > 0 && game.board.Field.every(c => c.name.includes("Raidraptor")))
    },
    getStateChanges: () => []
  }],
  flavor: "rr7"
}


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