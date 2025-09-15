<script setup>
import { ref, watch } from "vue";

const props = defineProps({
    label: String,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    modelValue: Number
});
const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue);

watch(localValue, (val) => {
    emit("update:modelValue", val);
});
</script>

<template>
    <div class="setting-item">
        <span>{{ label }}: {{ localValue }}</span>
        <input
            type="range"
            :min="min"
            :max="max"
            :step="step"
            v-model="localValue"
        />
    </div>
</template>

<style scoped>
.setting-item {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
}
input[type="range"] {
    width: 100%;
}
</style>
