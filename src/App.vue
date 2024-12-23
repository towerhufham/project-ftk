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
    <ElementIcons :resources="game.resources" id="debug-resources"/>
    <div id="attack-button" @click="attackButtonClick">
      {{ mode.type === "Attacking Standby" || mode.type === "Attacking" ? "Attacking!" : "Attack" }}
    </div>
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

  import type { Ability, CardInstance, GameState } from "./game"
  import { initGame, applyManualEffect, isAbilityActivatable, resumeTopTriggerWithTargets, moveCard, getCardZone } from "./game"
  import { hunter1, hunter2, hunter3, beast1, beast2, beast3 } from "./cards"
  import ElementIcons from "./ElementIcons.vue"


  type UIMode = {
    type: "Standby"
  } | {
    type: "Choosing Ability",
    card: CardInstance
  } | {
    type: "Choosing Targets",
    card: CardInstance,
    ability: Ability
  } | {
    type: "Attacking Standby"
  } | {
    type: "Attacking",
    card: CardInstance
  }

  const mode: Ref<UIMode> = ref({type: "Standby"})

  const game = ref(initGame([
    hunter1, hunter1, hunter2, hunter2, hunter3, hunter3,
    beast1, beast1, beast2, beast2, beast3, beast3
  ]))

  const cardClickHandler = (card: CardInstance) => {
    if (mode.value.type === "Standby") {
      mode.value = {type: "Choosing Ability", card}
    } else if (mode.value.type === "Attacking Standby") {
      if (getCardZone(game.value, card.iid) !== "Field") return
      mode.value = {type: "Attacking", card}
    } else if (mode.value.type === "Attacking") {
      if (card.iid === mode.value.card.iid) {
        //if click on same card, cancel
        mode.value = {type: "Attacking Standby"}
      } else {
        //if click on other card, try fighting
        //todo: actually do this logic correctly
        if (getCardZone(game.value, card.iid) !== "Field") return
        if (card.atk <= mode.value.card.atk) {
          game.value = moveCard(game.value, card.iid, "GY")
          if (card.atk === mode.value.card.atk) {
            game.value = moveCard(game.value, mode.value.card.iid, "GY")
          }
          mode.value = {type: "Attacking Standby"}
        }
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
    //the function we call here differs if ability is manual or a trigger
    const result = (mode.value.ability.activationType.type === "Manual")
      ? applyManualEffect(game.value, mode.value.card, mode.value.ability, targets)
      : resumeTopTriggerWithTargets(game.value, targets)
    finalizeResult(result)
  }

  const finalizeResult = (result: GameState) => {
    //might need a better name, handleResult()?
    game.value = result
    if (result.interactionState.type === "Standby") {
      mode.value = {type: "Standby"}
    } else if (result.interactionState.type === "Targeting") {
      mode.value = {type: "Choosing Targets", card: result.interactionState.card, ability: result.interactionState.ability}
    }
    console.log(game.value)
  }

  const attackButtonClick = () => {
    if (mode.value.type === "Standby") {
      mode.value = {type: "Attacking Standby"}
    } else if (mode.value.type === "Attacking Standby" || mode.value.type === "Attacking") {
      mode.value = {type: "Standby"}
    }
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
  #debug-resources {
    position: absolute;
    top: 5px;
    left: 5px;
    margin: 0;
    font-family: "Jost";
    font-weight: bold;
    font-size: 64px;
  }
  #attack-button {
    position: absolute;
    top: 5px;
    left: 47vw;
    font-size: 24px;
    background-color: darkred;
    color: white;
    padding: 10px;
    font-family: "Jost";
    border-radius: 10px;
    cursor: pointer;
  }
</style>