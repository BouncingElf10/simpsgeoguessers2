<script setup lang="ts">
</script>

<template>
    <div class="nav-bar">
        <slot></slot>
    </div>
</template>

<style scoped>
.nav-bar {
    width: auto;
    height: 40px;
    padding: 5px;
    margin: 5px 0 5px 5px;
    display: flex;
    gap: 5px;

    color: #ffffff;
    background: rgba(40, 40, 40, 0.9);
    border: 2px solid rgba(40, 40, 40, 0.8);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}
</style>

