//testing an idea
//code quality is not expected to be goos

import { shuffle } from "./utils"

type Cell = {
  name: string,
  produces: {
    green: number,
    blue: number
  },
  transmits: {
    green: boolean,
    blue: boolean
  },
  evolution?: {
    to: (() => Cell),
    green: number,
    blue: number
  }
}

const forest = (): Cell => {
  return {
    name: "Forest",
    produces: {
      green: 2,
      blue: 0
    },
    transmits: {
      green: true,
      blue: false
    },
    evolution: {
      to: betterForest,
      green: 10,
      blue: 0
    }
  }
}

const betterForest = (): Cell => {
  return {
    name: "Better Forest",
    produces: {
      green: 4,
      blue: 0
    },
    transmits: {
      green: true,
      blue: true
    }
  }
}

const river = (): Cell => {
  return {
    name: "River",
    produces: {
      green: 0,
      blue: 2
    },
    transmits: {
      green: false,
      blue: true
    },
    evolution: {
      to: betterRiver,
      green: 0,
      blue: 10
    }
  }
}

const betterRiver = (): Cell => {
  return {
    name: "Better River",
    produces: {
      green: 0,
      blue: 4
    },
    transmits: {
      green: true,
      blue: true
    }
  }
}

const wetland = (): Cell => {
  return {
    name: "Wetland",
    produces: {
      green: 0,
      blue: 0
    },
    transmits: {
      green: true,
      blue: true
    },
    evolution: {
      to: betterWetland,
      green: 10,
      blue: 10
    }
  }
}

const betterWetland = (): Cell => {
  return {
    name: "Better Wetland",
    produces: {
      green: 2,
      blue: 2,
    },
    transmits: {
      green: true,
      blue: true
    }
  }
}

let cells = [
  forest(), forest(), forest(), forest(), forest(), forest(), forest(), forest(), forest(), forest(), 
  river(), river(), river(), river(), river(), river(), river(), river(), river(), 
  wetland(), wetland(), wetland(), 
]

const simulate = (verbose: boolean) => {
  let currentEnergy = {
    green: 0,
    blue: 0
  }
  cells = shuffle(cells)
  if (verbose) console.log(`Starting with order: ${cells.map(c => c.name)}`)
  for (let i = 0; i < cells.length; i++) {
    const thisCell = cells[i]
    if (verbose) console.log(`Checking ${thisCell.name}`)
    // const nextCell = (i === cells.length-1) ? cells[0] : cells[i+1]
    currentEnergy = {
      green: currentEnergy.green + thisCell.produces.green,
      blue: currentEnergy.blue + thisCell.produces.blue
    }
    if (verbose) console.log(`Producing energy; is now (G: ${currentEnergy.green}, U: ${currentEnergy.blue})`)
    if (thisCell.evolution) {
      const evo = thisCell.evolution
      if (currentEnergy.green >= evo.green && currentEnergy.blue >= evo.blue) {
        cells[i] = evo.to()
        currentEnergy = {
          green: currentEnergy.green - evo.green,
          blue: currentEnergy.blue - evo.blue
        }
        if (verbose) console.log(`${thisCell.name} has evolved into ${cells[i].name}`)
        if (verbose) console.log(`Post-evolution; energy is now (G: ${currentEnergy.green}, U: ${currentEnergy.blue})`)
      }
    }
    currentEnergy = {
      green: cells[i].transmits.green ? currentEnergy.green : 0,
      blue: cells[i].transmits.blue ? currentEnergy.blue : 0
    }
  }
}

console.log(`Starting with order: ${cells.map(c => c.name)}`)
for (let i = 0; i < 5; i++) {
  simulate(false)
  console.log(`Current order: ${cells.map(c => c.name)}`)
}