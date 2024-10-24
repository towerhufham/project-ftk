<template>
  <main>
    <section id="field">
      <div id="field-d">
        <Card v-for="card of game.board['Field-D']" :card/>
      </div>
      <div id="field-c">
        <Card v-for="card of game.board['Field-C']" :card/>
      </div>
      <div id="field-b">
        <Card v-for="card of game.board['Field-B']" :card/>
      </div>
      <div id="field-a">
        <Card v-for="card of game.board['Field-A']" :card/>
      </div>
    </section>
    <section id="gy">
      <div id="gy-d">
        <Card v-for="card of game.board['GY-D']" :card/>
      </div>
      <div id="gy-c">
        <Card v-for="card of game.board['GY-C']" :card/>
      </div>
      <div id="gy-b">
        <Card v-for="card of game.board['GY-B']" :card/>
      </div>
      <div id="gy-a">
        <Card v-for="card of game.board['GY-A']" :card/>
      </div>
    </section>
    <section id="hand">
      <Card v-for="card of game.board.Hand" :card/>
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
    display: grid;
    grid-template-columns: 1fr 225px;
    grid-template-rows: 1fr 250px;
  }
  #field {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
  }
  #field > div {
    display: flex;
    justify-content: center;
  }
  #gy {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    background-color: #325517;
  }
  #gy > div {
    /*this is not correct, lol*/
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  #gy > div > article {
    /*for now*/
    max-height: 50px;
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
    background-color: #325517;
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