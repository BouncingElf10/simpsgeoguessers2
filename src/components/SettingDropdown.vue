<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
    label: String,
    options: { type: Array, required: true },
    modelValue: [String, Number]
});
const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue);

onMounted(() => {
    if (localValue.value == null && props.options.length > 0) {
        localValue.value = props.options[0];
        emit("update:modelValue", localValue.value);
    }
});

watch(localValue, (val) => {
    emit("update:modelValue", val);
});

watch(() => props.modelValue, (val) => {
    if (val !== localValue.value) localValue.value = val;
});
</script>

<template>
    <div class="setting-item">
        <span>{{ label }}: {{ localValue }}</span>
        <select v-model="localValue">
            <option
                v-for="option in options"
                :key="option"
                :value="option">
                {{ option }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.setting-item {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
    font-family: "Barlow", sans-serif;
    color: #e0e0e0;
}

span {
    margin-bottom: 6px;
}

select {
    width: 100%;
    padding: 8px 12px;
    font-size: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(25, 25, 25, 0.75);
    color: #e0e0e0;

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

    appearance: none;
    cursor: pointer;

    transition: border-color 0.2s, box-shadow 0.2s;
}

select {
    background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 14px;
    padding-right: 32px;
}

select:hover {
    border-color: rgba(255, 255, 255, 0.25);
}
select:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15);
}
</style>
