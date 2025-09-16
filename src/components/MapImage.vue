<script setup lang="ts">
    import { defineProps } from 'vue'

    const props = defineProps({
        imageId: {
            type: Number,
            required: true
        },
        inverted: {
            type: Boolean
        },
        bw: {
            type: Boolean
        },
        pixelated: {
            type: Boolean
        },
        blink: {
            type: Boolean
        }
    })

    function getImageUrl(id: number) {
        return new URL(`../assets/images/${id}.png`, import.meta.url).href
    }

</script>

<template>
    <img class="background-image" :src="getImageUrl(props.imageId)" alt="image"
         :style="{
         filter: (props.inverted ? 'invert(1) ' : '') + (props.bw ? 'grayscale(100%) ' : ''),
         imageRendering: props.pixelated ? 'pixelated' : 'auto',
         transition: props.blink ? 'filter 0.1s ease' : 'filter 0.5s ease'}"/>

    <div class="background">
        <slot></slot>
    </div>
</template>

<style scoped>
.background-image {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: #202020;
}

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
}

</style>
