<template>
  <main>
    <section id="hand">
      <Card v-for="card of game.board.Hand" :card/>
    </section>  
  </main>
</template>

<script setup lang="ts">
  import "./normalize.css"
  import { reactive } from "vue"
  import Card from "./Card.vue"
  import type { CardDefinition } from "./game"
  import { initGame, moveCard, spawnCardIntoGame } from "./game"

  const def1: CardDefinition = {
    name: "Alpha",
    collectionNumber: 0,
    elements: new Set(["Fire"]),
    level: 1,
    abilities: [{
      name: "Draw 1",
      limit: "OPT",
      getStateChanges: () => [{type: "Draw Card"}]
    }],
    power: 100,
    allowedLayers: {
      "A": true,
      "B": false,
      "C": false,
      "D": false
    },
    flavor: "Alpha test go!"
  } 
  const def2: CardDefinition = {
    name: "Beta",
    collectionNumber: 1,
    elements: new Set(["Water"]),
    level: 3,
    abilities: [{
      name: "Draw 2",
      limit: "OPT",
      getStateChanges: () => [{type: "Draw Card"}, {type: "Draw Card"}]
    }],
    power: 200,
    allowedLayers: {
      "A": true,
      "B": true,
      "C": false,
      "D": false
    },
    flavor: "Beta test go!!"
  }

  let game = reactive(initGame([
    def1, def1, def1, def1, def1, 
    def2, def2, def2, def2, def2,
  ]))

  game = moveCard(game, 7, "Field-A")
  game = spawnCardIntoGame(game, def2, "GY-B")
  // const grabbyCard = game.board.Hand[0]
  // game = applyEffect(game, grabbyCard, grabbyCard.abilities[0])
</script>

<style scoped>
  main {
    width: 100vw;
    height: 100vh;
    position: relative;
    background-color: #c4ffd0;
  }
  #hand {
    display: flex;
    gap: 5px;
    padding: 15px;
    justify-content: center;
    position: absolute;
    width: 100vw;
    bottom: 0px;
    background-color: #7ec85c;
  }
</style>