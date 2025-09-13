<script setup lang="ts">
    import { defineProps } from 'vue'

    const props = defineProps({
        imageId: {
            type: Number,
            required: true
        }
    })

    function getImageUrl(id: number) {
        return new URL(`../assets/images/${id}.png`, import.meta.url).href
    }

</script>

<template>
    <div
        class="background"
        :style="{ backgroundImage: `url(${getImageUrl(imageId)})` }"
    >
        <slot></slot>
    </div>
</template>

<style scoped>
.background {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: row;
    background-color: #202020;
}

body {  }

</style>
