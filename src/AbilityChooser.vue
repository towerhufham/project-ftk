<template>
  <div class="modal" @click.self="emit('cancel')">
    <div class="holder">
      <p id="intro-text">Choose ability:</p>
      <p id="error">
        <span v-if="errorMessage !== 'OK' && errorMessage !== ''">{{ errorMessage }}</span>
        <span >&nbsp;</span>
      </p>
      <template v-for="ability of props.card.abilities" >
        <div v-if="ability.activationType.type === 'Manual'"
          @click="emit('select', ability)" @mouseenter="errorMessage = isAbilityActivatable(game, card, ability)"
          @mouseleave="errorMessage = ''" class="ability-button"
          :class="{'activatable': canActivateAbility(ability)}"
        >
          <p>◆{{ ability.description }}</p>
        </div>
        <div v-else class="trigger">
          <p>◇{{ ability.description }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { CardInstance, GameState, Ability } from "./game"
  import { isAbilityActivatable } from "./game"
  import { ref } from "vue"

  const props = defineProps<{
    game: GameState
    card: CardInstance
  }>()

  const emit = defineEmits<{
    cancel: [],
    select: [ability: Ability]
  }>()

  const errorMessage = ref("")

  const canActivateAbility = (ability: Ability) => {
    return (isAbilityActivatable(props.game, props.card, ability) === "OK")
  }
</script>

<style scoped>
  /* todo: extract this modal stuff into css file */
  .modal {
    position: absolute;
    z-index: 999;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
  }
  .modal p {
    font-family: "Jost", sans-serif;
  }
  #intro-text {
    margin-bottom: 0;
  }
  #error {
    margin: 0;
    color: red;
  }
  .holder {
    background-color: white;
    width: 50vw;
    display: flex;
    gap: 10px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-bottom: 15px;
  }
  .ability-button {
    border: solid 5px black;
    cursor: pointer;
    padding: 0 10px;
    transition: all 0.25s;
    width: 50%;
  }
  @keyframes glow {
    from {border: solid 4px black;}
    to {border: solid 4px cornflowerblue;}
  }
  .ability-button.activatable {
    animation: glow;
    animation-duration: 0.75s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  .ability-button.activatable:hover {
    background-color: cornflowerblue;
  }
  .ability-button:not(.activatable) {
    background-color: lightgrey;
    cursor: unset;
  }
  .trigger {
    border: solid 5px gray;
    color: gray;
    padding: 0 10px;
    transition: all 0.25s;
    width: 50%;
  }
</style>