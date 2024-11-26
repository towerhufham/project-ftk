<template>
  <article :class="{'activatable': hasActivatableAbility}" :style="backgroundGradientStyle">
    <p id="name">{{ card.name }}</p>
    <p id="flavor">{{ card.flavor }}</p>
    <p id="atk">{{ card.atk }}</p>
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance, GameState } from "./game"
  import { isAbilityActivatable } from "./game"
  import { computed } from "vue"

  const props = defineProps<{
    game: GameState,
    card: CardInstance
  }>()

  const hasActivatableAbility = computed(() => {
    return props.card.abilities.filter(a => a.activationType.type === "Manual")
      .map(a => isAbilityActivatable(props.game, props.card, a))
      .some(val => val === "OK")
  })

  const backgroundGradientStyle = computed(() => {
    const stops = props.card.bgGradient 
    if (stops.length === 0) return {"background-color": "rgb(170, 170, 170)"}
    if (stops.length === 1) return {"background-color": stops[0]}
    let pairs = []
    let nextStop = 0
    for (const stop of stops) {
      pairs.push(`${stop} ${nextStop}%`)
      nextStop += 100 / (stops.length - 1)
    }
    const deg = stops.length <= 2 ? 180 : 135
    return {"background-image": `linear-gradient(${deg}deg, ${pairs.join(', ')})`}
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
  #atk {
    font-style: italic;
    position: absolute;
    right: 5px;
    bottom: 5px;
    margin: 0;
    font-family: "Jost", serif;
    font-size: 18px;
  }
</style>