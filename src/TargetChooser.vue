<template>
  <div class="modal" @click.self="emit('cancel')">
    <div class="holder">
      <p>({{ ability.description }})</p>
      <p>Choose target:</p>
      <div id="cards">
        <div class="card-holder" v-for="targetInfo of validTargets" >
          <Card :card="targetInfo.card" :game @click="emit('select', targetInfo.card)" />
          <p>In {{ targetInfo.zone }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Card from "./Card.vue"
  import type { CardInstance, GameState, Ability } from "./game"
  import { getValidAbilityTargets, getCardZone } from "./game"
  import { computed } from "vue"

  //todo: make cards not hover if they're activatable
  //also probably should show deck as sorted

  const props = defineProps<{
    game: GameState
    card: CardInstance
    ability: Ability
  }>()

  const emit = defineEmits<{
    cancel: [],
    select: [target: CardInstance]
  }>()

  const validTargets = computed(() => {
    return getValidAbilityTargets(props.game, props.card, props.ability).map(c => {
      return {card: c, zone: getCardZone(props.game, c.iid)}
    })
  })
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
  .holder {
    background-color: white;
    width: 50vw;
    display: flex;
    gap: 10px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 15px 15px;
    max-height: 80vh;
  }
  #cards {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    overflow-y: scroll;
    justify-content: center;
  }
  .card-holder {
    cursor: pointer;
  }
</style>