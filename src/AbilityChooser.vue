<template>
  <div class="modal" @click.self="emit('cancel')">
    <div class="holder">
      <p>Choose ability:</p>
      <div v-for="ability of props.card.abilities" @click="emit('select', card, ability)" class="ability-button">
        <p>◆{{ability.name}}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Ability, CardInstance } from "./game"

  const props = defineProps<{
    card: CardInstance
  }>()

  const emit = defineEmits<{
    cancel: [],
    select: [card: CardInstance, ability: Ability]
  }>()
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
  .holder {
    background-color: white;
    width: 50vw;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-bottom: 15px;
  }
  .ability-button {
    border: solid 1px black;
    cursor: pointer;
    padding: 0 10px;
  }
</style>