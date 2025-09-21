<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
    modelValue: String,
    label: String,
    placeholder: {
        type: String,
        default: ""
    },
    buttonText: {
        type: String,
        default: "Submit"
    },
    storageKey: {
        type: String,
        default: "setting-input"
    }
});

const emit = defineEmits(["update:modelValue", "submit"]);

const localValue = ref("");

onMounted(() => {
    const saved = localStorage.getItem(props.storageKey);
    if (saved !== null) {
        localValue.value = saved;
        emit("update:modelValue", saved);
    } else {
        localValue.value = props.modelValue || "";
    }
});

watch(() => props.modelValue, (newVal) => {
    localValue.value = newVal;
});


watch(localValue, (newVal) => {
    localStorage.setItem(props.storageKey, newVal);
    emit("update:modelValue", newVal);
});

function handleSubmit() {
    if (localValue.value.trim()) {
        emit("submit", localValue.value);
    }
}
</script>

<template>
    <div class="setting-input">
        <label v-if="label">{{ label }}</label>
        <div class="input-row">
            <input
                type="text"
                v-model="localValue"
                :placeholder="placeholder"
                @keyup.enter="handleSubmit"
            />
            <button class="submit-btn" @click="handleSubmit">{{ buttonText }}</button>
        </div>
    </div>
</template>

<style scoped>
.setting-input {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: "Barlow", sans-serif;
}

.setting-input label {
    font-size: 18px;
    font-weight: 500;
    font-family: "Barlow", sans-serif;
    color: #fff;
}

.input-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
}

.input-row input {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 14px;
    font-family: "Barlow", sans-serif;
    transition: background 0.2s ease;
}

.input-row input:focus {
    background: rgba(255, 255, 255, 0.2);
}

.submit-btn {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-family: "Barlow", sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
}

.submit-btn:hover {
    background: rgba(255, 255, 255, 0.35);
}
</style>
