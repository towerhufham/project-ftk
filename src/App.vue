<template>
  <AbilityChooser 
    v-if="mode.type === 'Choosing Ability'" 
    :card="mode.card" :game
    @cancel="mode = {type: 'Standby'}"
    @select="(ability: Ability) => tryAbility(ability)"
  />
  <!-- todo: multitargeting -->
  <TargetChooser 
    v-if="mode.type === 'Choosing Targets'" 
    :card="mode.card" :ability="mode.ability" :game
    @cancel="mode = {type: 'Standby'}"
    @select="(target: CardInstance) => executeAbilityWithTargets([target])"
  />
  <main>
    <section id="field">
      <Card v-for="card of game.board['Field']" :game :card @click="cardClickHandler(card)"/>
    </section>
    <section id="gy">
      <Card v-for="card of game.board['GY']" :game :card @click="cardClickHandler(card)"/>
    </section>
    <section id="hand">
      <Card v-for="card of game.board['Hand']" :game :card @click="cardClickHandler(card)"/>
    </section>
    <section id="deck-holder">
      <div id="deck">
        <p>{{ game.board.Deck.length }}</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
  import "./normalize.css"
  import { ref, Ref } from "vue"

  import Card from "./Card.vue"
  import AbilityChooser from "./AbilityChooser.vue"
  import TargetChooser from "./TargetChooser.vue"

  import type { Ability, CardDefinition, CardInstance, GameState } from "./game"
  import { initGame, applyManualEffect, isAbilityActivatable, getCardZone } from "./game"

  //----------------- TESTING --------------------//

  const def1: CardDefinition = {
    name: "Alpha",
    collectionNumber: 0,
    elements: new Set(["Fire"]),
    level: 1,
    abilities: [{
      description: "Search Any From Deck",
      minLevel: 1,
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
      minLevel: 1,
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
    power: 100,
    flavor: "Alpha test go!"
  } 
  const def2: CardDefinition = {
    name: "Beta",
    collectionNumber: 1,
    elements: new Set(["Water", "Dark"]),
    level: 3,
    abilities: [{
      description: "Summon",
      minLevel: 1,
      limitPerTurn: 1,
      onlyFrom: "Hand",
      sendTo: "Field",
      activationType: {type: "Manual"},
      getStateChanges: () => []
    },
    {
      description: "Draw 2",
      minLevel: 1,
      limitPerTurn: 1,
      onlyFrom: "Field",
      activationType: {type: "Manual"},
      getStateChanges: () => [{type: "Draw Card"}, {type: "Draw Card"}]
    }],
    power: 200,
    flavor: "Beta test go!!"
  }

  const rr1: CardDefinition = {
    name: "Raidraptor - Tribute Lanius",
    collectionNumber: 10,
    elements: new Set(["Wind", "Dark"]),
    level: 2,
    abilities: [{
      description: "Summon this and send a Raidraptor from your Deck to the GY",
      minLevel: 1,
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
    power: 200,
    flavor: "rr1"
  }

  const rr2: CardDefinition = {
    name: "Raidraptor - Heel Eagle",
    collectionNumber: 11,
    elements: new Set(["Wind", "Dark"]),
    level: 1,
    abilities: [{
      description: "Summon this if all monsters on the field are Raidraptors (minimum 1)",
      minLevel: 1,
      limitPerTurn: 1,
      onlyFrom: "Hand",
      sendTo: "Field",
      activationType: {type: "Manual"},
      condition: (game) => {
        return (game.board.Field.length > 0 && game.board.Field.every(c => c.name.includes("Raidraptor")))
      },
      getStateChanges: () => []
    }],
    power: 200,
    flavor: "rr2"
  }

  //----------------- END TESTING --------------------//


  type UIMode = {
    type: "Standby"
  } | {
    type: "Choosing Ability",
    card: CardInstance
  } | {
    type: "Choosing Targets",
    card: CardInstance,
    ability: Ability
  }

  const mode: Ref<UIMode> = ref({type: "Standby"})

  const game = ref(initGame([
    def1, def1, def1, def1, def1, 
    def2, def2, def2, def2, def2,
    rr1, rr1, rr1, rr2, rr2, rr2
  ]))

  const cardClickHandler = (card: CardInstance) => {
    if (mode.value.type === "Standby") {
      mode.value = {
        type: "Choosing Ability", 
        card
      }
    }
  }

  const tryAbility = (ability: Ability) => {
    if (mode.value.type !== "Choosing Ability") throw new Error(`UI ERROR: Called tryAbility while ui is in '${mode.value.type}' mode`)
    const card = mode.value.card
    const activationResult = isAbilityActivatable(game.value, card, ability)
    if (activationResult !== "OK") return
    if (ability.targeting) {
      //if ability targets, set ui to targeting mode
      mode.value = {type: "Choosing Targets", card, ability}
    } else {
      //if it doesn't target, go ahead and activate
      const result = applyManualEffect(game.value, mode.value.card, ability, [])
      finalizeResult(result)
    }
  }

  const executeAbilityWithTargets = (targets: CardInstance[]) => {
    if (mode.value.type !== "Choosing Targets") throw new Error(`UI ERROR: Called executeAbilityWithTargets while ui is in '${mode.value.type}' mode`)
    //WORKING: this is where i left off
    //this is currently being called on triggers, not necessarily just manual abilities
    //need to either handle both cases here, or make a trigger-specific function and make this one manual-specific
    const result = applyManualEffect(game.value, mode.value.card, mode.value.ability, targets)
    finalizeResult(result)
  }

  const finalizeResult = (result: GameState) => {
    //might need a better name (handleResult()?)
    game.value = result
    if (result.interactionState.type === "Standby") {
      mode.value = {type: "Standby"}
    } else if (result.interactionState.type === "Targeting") {
      mode.value = {type: "Choosing Targets", card: result.interactionState.card, ability: result.interactionState.ability}
    }
    console.log(game.value)
  }
</script>

<style scoped>
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    background-color: #c4ffd0;
    display: grid;
    grid-template-columns: 1fr 225px;
    grid-template-rows: 1fr 250px;
  }
  #field {
    display: flex;
    gap: 5px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }
  #gy {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    background-color: #7ec85c;
    overflow-y: scroll; /*this squishes instead, not sure why :thinking:*/
  }
  #hand {
    display: flex;
    gap: 5px;
    padding: 15px;
    justify-content: center;
    align-items: center;
    background-color: #7ec85c;
  }
  #deck-holder {
    background-color: #407b13;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #deck {
    width: 150px;
    height: 200px;
    border: solid 1px black;
    position: relative;
    background-color: ghostwhite;
    display: flex;
    justify-content: center;
    align-content: center;
  }
  #deck > p {
    font-size: 64px;
    font-weight: bold;
    font-family: "Aldrich", serif;
  }
</style>