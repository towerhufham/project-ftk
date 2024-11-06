<template>
  <div class="modal" @click.self="emit('cancel')">
    <div class="holder">
      <p>Choose ability:</p>
      <div 
        v-for="ability of props.card.abilities" 
        @click="emit('select', card, ability)" 
        class="ability-button"
        :class="{'activatable': canActivateAbility(ability)}"
      >
        <p>◆{{ability.name}}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { CardInstance, GameState, Ability } from "./game"
  import { isAbilityActivatable } from "./game"

  const props = defineProps<{
    game: GameState
    card: CardInstance
  }>()

  const emit = defineEmits<{
    cancel: [],
    select: [card: CardInstance, ability: Ability]
  }>()

  const canActivateAbility = (ability: Ability) => {
    return (isAbilityActivatable(props.game, props.card, ability) === true)
  }
</script>

<style scoped>
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
</style>