<script setup lang="ts">

</script>

<template>
    <button class="nav-item">
        <slot></slot>
    </button>
</template>

<style scoped>
.nav-item {
    width: auto;
    display: flex;
    color: #ffffff;
    background: rgba(66, 66, 66, 0.44);
    border: 2px solid rgba(66, 66, 66, 0.44);
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    padding: 10px 20px;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    font-family: "Barlow", sans-serif;
    font-weight: 500;
    font-style: normal;
    line-height: normal;
    vertical-align: middle;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-size-adjust: auto;
    -webkit-text-size-adjust: auto;
}
.nav-item:hover {
    background: rgba(41, 41, 41, 0.44);
    border: 2px solid rgba(41, 41, 41, 0.44);
}
.nav-item:active {
    transform: scale(0.95);
}
</style>