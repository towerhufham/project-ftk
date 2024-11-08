<template>
  <article :class="{'activatable': hasActivatableAbility}" :style="getElementalGradientStyle(card.elements)">
    <p id="name">{{ card.name }}</p>
    <p id="flavor">{{ card.flavor }}</p>
    <div id="elements">
      <ElementIcon v-for="e of card.elements" :e/>
    </div>
  </article>
</template>

<script setup lang="ts">
  import ElementIcon from "./ElementIcon.vue"
  import type { CardInstance, GameState } from "./game"
  import { isAbilityActivatable } from "./game"
  import { getElementalGradientStyle } from "./elementalStyles"
  import { computed } from "vue"

  const props = defineProps<{
    game: GameState,
    card: CardInstance
  }>()

  const hasActivatableAbility = computed(() => {
    return props.card.abilities.map(a => isAbilityActivatable(props.game, props.card, a)).some(val => val === "OK")
  })
</script>

<style scoped>
  article {
    width: 150px;
    height: 200px;
    border: solid 4px black;
    position: relative;
    background-color: ghostwhite;
    transition: all 0.25s;
  }
  @keyframes glow {
    from {border: solid 4px black;}
    to {border: solid 4px cornflowerblue;}
  }
  article.activatable {
    animation: glow;
    animation-duration: 0.75s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  article.activatable:hover {
    transform: translateY(-25px);
  }
  #name {
    font-weight: bold;
    position: absolute;
    left: 5px;
    top: 5px;
    margin: 0;
    font-family: "Alegreya SC", serif;
  }
  #flavor {
    font-style: italic;
    position: absolute;
    left: 5px;
    bottom: 5px;
    margin: 0;
    font-family: "Alegreya SC", serif;
  }
  #elements {
    position: absolute;
    right: 5px;
    top: 5px;
  }
</style>