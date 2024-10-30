<template>
  <!-- todo: sometimes cancelling won't be allowed -->
  <AbilityChooser 
    v-if="mode.type === 'Choosing Ability'" 
    :card="mode.card" 
    @cancel="mode = {type: 'Standby'}"
    @select="(card: CardInstance, ability: Ability) => tryAbility(card, ability)"
  />
  <main>
    <section id="field">
      <Card v-for="card of game.board['Field']" :card @click="cardClickHandler(card)"/>
    </section>
    <section id="gy">
      <Card v-for="card of game.board['GY']" :card @click="cardClickHandler(card)"/>
    </section>
    <section id="hand">
      <Card v-for="card of game.board.Hand" :card @click="cardClickHandler(card)"/>
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

  import type { Ability, CardDefinition, CardInstance } from "./game"
  import { initGame, applyEffect, isAbilityActivatable } from "./game"

  //----------------- TESTING --------------------//

  const def1: CardDefinition = {
    name: "Alpha",
    collectionNumber: 0,
    elements: new Set(["Fire"]),
    level: 1,
    abilities: [{
      name: "Draw 1",
      limitPerTurn: 1,
      sendTo: "GY",
      getStateChanges: () => [{type: "Draw Card"}]
    }],
    power: 100,
    flavor: "Alpha test go!"
  } 
  const def2: CardDefinition = {
    name: "Beta",
    collectionNumber: 1,
    elements: new Set(["Water"]),
    level: 3,
    abilities: [{
      name: "Summon",
      limitPerTurn: 1,
      onlyFrom: "Hand",
      sendTo: "Field",
      getStateChanges: () => []
    },
    {
      name: "Draw 2",
      limitPerTurn: "Unlimited",
      onlyFrom: "Field",
      getStateChanges: () => [{type: "Draw Card"}, {type: "Draw Card"}]
    }],
    power: 200,
    flavor: "Beta test go!!"
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
  ]))

  const cardClickHandler = (card: CardInstance) => {
    if (mode.value.type === "Standby") {
      mode.value = {
        type: "Choosing Ability", 
        card
      }
    }
    //todo: if (mode.value.type === "Choosing Targets")
  }

  const tryAbility = (card: CardInstance, ability: Ability) => {
    const activatable = isAbilityActivatable(game.value, card, ability)
    if (typeof activatable === "string") {
      //didn't work
      alert(activatable)
    } else {
      //did work
      const result = applyEffect(game.value, card, ability)
      game.value = result
      mode.value = {type: "Standby"}
      console.log(game.value)
    }
  }

  // game = moveCard(game, 7, "Field-A")
  // game = spawnCardIntoGame(game, def2, "GY-B")
  // const grabbyCard = game.board.Hand[0]
  // game = applyEffect(game, grabbyCard, grabbyCard.abilities[0])
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
  }
</style>