<script setup lang="ts">
defineProps<{
    variant?: "title" | "subtitle" | "body" | "highlight"
}>()
</script>

<template>
    <div :class="['info-text', variant]">
        <slot></slot>
    </div>
</template>

<style scoped>
.info-text {
    font-family: "Barlow", sans-serif;
    line-height: 1.6;
    margin: 4px 0;
    transition: color 0.3s ease;
}

.info-text.title {
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
}

.info-text.subtitle {
    font-size: 18px;
    font-weight: 500;
    color: #dddddd;
}

.info-text.body {
    font-size: 16px;
    font-weight: 400;
    color: #cfcfcf;
}

.info-text.highlight {
    font-size: 16px;
    font-weight: 500;
    color: #4da6ff;
}
</style>
