<template>
  <article>
    <p id="name">{{ props.card.name }}</p>
    <p id="flavor">{{ props.card.flavor }}</p>
  </article>
</template>

<script setup lang="ts">
  import type { CardInstance } from "./game"
  const props = defineProps<{
    card: CardInstance
  }>()
</script>

<style scoped>
  article {
    width: 150px;
    height: 200px;
    border: solid 1px black;
    position: relative;
    background-color: ghostwhite;
  }
  #name {
    font-weight: bold;
    position: absolute;
    left: 5px;
    top: 5px;
  }
  #flavor {
    font-style: italic;
    position: absolute;
    left: 5px;
    bottom: 5px;
  }
</style>