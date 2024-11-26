import type { Ability, CardDefinition, CardInstance, GameState, Resource, StateChange } from "./game"
import { getCardZone } from "./game"

import { moveTargetsToZone } from "./ability"

//----------------- DEBUG CARDS -----------------//



//----------------- LINEAR ALGEBRA ANGELS? -----------------//

// export const pemi: CardDefinition = {
//   name: "Pemi, the Fairyguide",
//   collectionNumber: 1,
//   bgGradient: ["#ffffff", "#FFFFC5"],
//   abilities: [{
//     description: "Summon this.",
//     limitPerTurn: 1,
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     activationType: {type: "Manual"},
//     getStateChanges: () => []
//   }, {
//     description: "1 Holy → Send this to the GY to search a 'Fairy' to your hand.",
//     limitPerTurn: 1,
//     onlyFrom: "Field",
//     sendTo: "GY",
//     activationType: {type: "Manual"},
//     targeting: {
//       canSelfTarget: false,
//       isCardValidTarget: (game, thisCard, target) => {
//         return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Fairy"))
//       }
//     },
//     resourceCost: [{resource: "Holy", amount: 1}],
//     getStateChanges: moveTargetsToZone("Hand")
//   }],
//   flavor: "Bweeeooo"
// }

// export const fairy1: CardDefinition = {
//   name: "Column Fairy",
//   collectionNumber: 2,
//   bgGradient: ["#ffffff", "#90EE90"],
//   abilities: [{
//     description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
//     limitPerTurn: "Unlimited",
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     activationType: {type: "Manual"},
//     condition: (game) => {
//       return (game.board.Field.length < 3)
//     },
//     getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
//   }],
//   flavor: "It perches on the columns"
// }

// export const fairy2: CardDefinition = {
//   name: "Row Fairy",
//   collectionNumber: 3,
//   bgGradient: ["#ffffff", "#FF6961"],
//   abilities: [{
//     description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
//     limitPerTurn: "Unlimited",
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     activationType: {type: "Manual"},
//     condition: (game) => {
//       return (game.board.Field.length < 3)
//     },
//     getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
//   }],
//   flavor: "It flies low to the cloudy puffs and the golden ground"
// }

// export const fairy3: CardDefinition = {
//   name: "Diagonal Fairy",
//   collectionNumber: 4,
//   bgGradient: ["#ffffff", "#ADD8E6"],
//   abilities: [{
//     description: "Summon this if there are fewer than 3 cards on the field. +1 Holy",
//     limitPerTurn: "Unlimited",
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     activationType: {type: "Manual"},
//     condition: (game) => {
//       return (game.board.Field.length < 3)
//     },
//     getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 1}]
//   }],
//   flavor: "They can be seen descending from high up in groups"
// }

//----------------- QLIPHORT --------------//

// export const qli1: CardDefinition = {
//   name: "Qliphort Towers",
//   collectionNumber: 100,
//   bgGradient: ["black", "white"],
//   abilities: [{
//     description: "If all cards on the field are Qliphort, and there are at least 3 of them, send them all to the GY and summon this.",
//     limitPerTurn: 1,
//     onlyFrom: "Hand",
//     sendTo: "Field",
//     activationType: {type: "Manual"},
//     condition: (game) => {
//       return (game.board.Field.length >= 3 && game.board.Field.every(c => c.name.includes("Qli")))
//     },
//     getStateChanges: (ctx) => ctx.game.board.Field.map(c => {return {type: "Move Card", iid: c.iid, toZone: "GY"}})
//   }],
//   flavor: "Towers"
// }

// const qlipDiscard = (resource: Resource): Ability => {
//   return {
//     description: `Send this to the GY, +1 ${resource}.`,
//     limitPerTurn: 1,
//     onlyFrom: "Hand",
//     sendTo: "GY",
//     activationType: {type: "Manual"},
//     getStateChanges: () => [{type: "Add Resource", resource, amount: 1}]
//   }
// }

// const qlipSummon: Ability = {
//   description: `1 Holy, 1 Dark → Summon this.`,
//   limitPerTurn: 1,
//   onlyFrom: "Hand",
//   sendTo: "Field",
//   activationType: {type: "Manual"},
//   resourceCost: [{resource: "Holy", amount: 1}, {resource: "Dark", amount: 1}],
//   getStateChanges: () => []
// }

// export const qli2: CardDefinition = {
//   name: "Qliphort Scout",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "yellow"],
//   abilities: [
//     qlipDiscard("Holy"),
//     qlipSummon,
//     {
//       description: "Search for a Qliphort from your deck to your hand.",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       targeting: {
//         canSelfTarget: false,
//         isCardValidTarget: (game, thisCard, target) => {
//           return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Qliphort"))
//         }
//       },
//       getStateChanges: moveTargetsToZone("Hand")
//     }
//   ],
//   flavor: "Scout"
// }

// export const qli3: CardDefinition = {
//   name: "Qliphort Monolith",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "purple"],
//   abilities: [
//     qlipDiscard("Dark"),
//     qlipSummon,
//     {
//       description: "Draw 1 for each Qliphort on the field.",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       getStateChanges: (ctx) => ctx.game.board.Field.filter(c => c.name.includes("Qli")).map(_ => {return {type: "Draw Card"}})
//     }
//   ],
//   flavor: "Monolith"
// }

// export const qli4: CardDefinition = {
//   name: "Qliphort Carrier",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "green"],
//   abilities: [
//     qlipDiscard("Dark"),
//     qlipSummon,
//     {
//       description: "+2 Holy",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       getStateChanges: () => [{type: "Add Resource", resource: "Holy", amount: 2}]
//     }
//   ],
//   flavor: "Carrier"
// }

// export const qli5: CardDefinition = {
//   name: "Qliphort Helix",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "orange"],
//   abilities: [
//     qlipDiscard("Holy"),
//     qlipSummon,
//     {
//       description: "+2 Dark",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       getStateChanges: () => [{type: "Add Resource", resource: "Dark", amount: 2}]
//     }
//   ],
//   flavor: "Carrier"
// }

// export const qli6: CardDefinition = {
//   name: "Qliphort Disk",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "blue"],
//   abilities: [
//     qlipDiscard("Dark"),
//     qlipSummon,
//     {
//       description: "Summon a Qliphort from your deck.",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       targeting: {
//         canSelfTarget: false,
//         isCardValidTarget: (game, _, target) => {
//           return (getCardZone(game, target.iid) === "Deck" && target.name.includes("Qli"))
//         }
//       },
//       getStateChanges: moveTargetsToZone("Field")
//     }
//   ],
//   flavor: "Carrier"
// }

// export const qli7: CardDefinition = {
//   name: "Qliphort Cephalopod",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "red"],
//   abilities: [
//     qlipDiscard("Holy"),
//     qlipSummon,
//     {
//       description: "Place all Qliphort cards in the GY on the bottom of your Deck.",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       getStateChanges: (ctx) => ctx.game.board.GY.filter(c => c.name.includes("Qli")).map(q => {return {type: "Move Card", iid: q.iid, toZone: "Deck"}})
//     }
//   ],
//   flavor: "Cephalopod"
// }

// export const qli8: CardDefinition = {
//   name: "Qliphort Stealth",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "grey"],
//   abilities: [
//     qlipDiscard("Dark"),
//     qlipSummon,
//     {
//       description: "Move target Qliphort on the field to your hand.",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       targeting: {
//         canSelfTarget: true,
//         isCardValidTarget: (game, _, target) => {
//           return (getCardZone(game, target.iid) === "Field" && target.name.includes("Qli"))
//         } 
//       },
//       getStateChanges: moveTargetsToZone("Hand")
//     }
//   ],
//   flavor: "Stealth"
// }

// export const qli9: CardDefinition = {
//   name: "Qliphort Shell",
//   collectionNumber: 100,
//   bgGradient: ["#ffffff", "black"],
//   abilities: [
//     qlipDiscard("Holy"),
//     qlipSummon,
//     {
//       description: "Send another Qliphort on the field to the GY, +1 Holy, +1 Dark",
//       limitPerTurn: 1,
//       onlyFrom: "Field",
//       activationType: {type: "Manual"},
//       targeting: {
//         canSelfTarget: false,
//         isCardValidTarget: (game, _, target) => {
//           return (getCardZone(game, target.iid) === "Field" && target.name.includes("Qli"))
//         } 
//       },
//       getStateChanges: (ctx) => [
//         ...moveTargetsToZone("GY")(ctx), 
//         {type: "Add Resource", resource: "Holy", amount: 1}, 
//         {type: "Add Resource", resource: "Dark", amount: 1}
//       ]
//     }
//   ],
//   flavor: "Shell"
// }

// --------------------- AREA 01 - STRIPED LAGOON


// --------------------- AREA 02 - MYTHICAL WILDS

const simpleSummon: Ability = {
  description: "Summon this.",
  limitPerTurn: 1,
  activationType: {type: "Manual"},
  sendTo: "Field",
  onlyFrom: "Hand",
  getStateChanges: () => []
}

export const hunter1: CardDefinition = {
  name: "Atro, Beast Hunter",
  collectionNumber: 100,
  bgGradient: ["green", "orange"],
  abilities: [
    simpleSummon
    //on summon, search a "Beast" to hand
    //on magical beast kill, gain 500 atk 
  ],
  flavor: "#1",
  atk: 1000
}

export const hunter2: CardDefinition = {
  name: "Sopho, Beast Trapper",
  collectionNumber: 100,
  bgGradient: ["blue", "orange"],
  abilities: [
    simpleSummon
    //on summon, special summon a "Beast"
    //on magical beast kill, all cards lose 300 def 
  ],
  flavor: "#2",
  atk: 500
}

export const hunter3: CardDefinition = {
  name: "Clara, Beast Tamer",
  collectionNumber: 100,
  bgGradient: ["red", "orange"],
  abilities: [
    simpleSummon
    //on summon, send a magical beast from deck to GY
    //on magical beast kill, return magical beast in GY to field
  ],
  flavor: "#3",
  atk: 200
}

export const beast1: CardDefinition = {
  name: "Magical Beast Redfox",
  collectionNumber: 100,
  bgGradient: ["red", "white"],
  abilities: [
    simpleSummon
    //can only summon if there are no cards on field
    //when defeated, all cards gain 200 atk, shuffle into deck
  ],
  flavor: "#1",
  atk: 400
}

export const beast2: CardDefinition = {
  name: "Magical Beast Bluebear",
  collectionNumber: 100,
  bgGradient: ["blue", "white"],
  abilities: [
    simpleSummon
    //can only summon if there are no cards on field
    //when defeated, all cards lose 200 def, shuffle into deck
  ],
  flavor: "#2",
  atk: 500
}

export const beast3: CardDefinition = {
  name: "Magical Beast Greenrabbit",
  collectionNumber: 100,
  bgGradient: ["green", "white"],
  abilities: [
    simpleSummon
    //can only summon if there are no cards on field
    //when defeated, search magical beast to hand, shuffle into deck
  ],
  flavor: "#3",
  atk: 200
}