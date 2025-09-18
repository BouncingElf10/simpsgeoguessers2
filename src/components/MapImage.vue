<script setup lang="ts">
    import { defineProps } from 'vue'

    const props = defineProps({
        mapId: {
            type: Number,
            required: true
        },
        imageId: {
            type: Number,
            required: true
        },
        inverted: Boolean,
        bw: Boolean,
        pixelated: Boolean,
        blink: Boolean,
    })

    const images = import.meta.glob('../assets/maps/simps*/images/*.{jpg,png}', { eager: true });

    function getImageUrl(id: number, mapId: number): string {
        const pngPath = `../assets/maps/simps${mapId}/images/${id}.png`;
        const jpgPath = `../assets/maps/simps${mapId}/images/image${id}.jpg`;

        if (images[pngPath]) return images[pngPath].default;
        if (images[jpgPath]) return images[jpgPath].default;

        console.warn(`Image not found: ${id} in map ${mapId}`);
        return '';
    }

</script>

<template>
    <div class="map-image-wrapper" v-bind="$attrs">
        <img
            class="background-image"
            :src="getImageUrl(props.imageId, props.mapId)"
            alt="image"
            :style="{
        filter: (props.pixelated ? 'url(#pixelate) ' : '') +
                (props.inverted ? 'invert(1) ' : '') +
                (props.bw ? 'grayscale(100%) ' : ''),
        transition: props.blink ? 'filter 0.1s ease' : 'filter 0.5s ease'}"/>
        <div class="background">
            <slot></slot>
        </div>
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
