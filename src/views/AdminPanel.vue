<script setup>
import { ref, onMounted } from "vue";

const adminToken = ref("");
const recent = ref([]);
const banned = ref([]);
const message = ref("");

async function loadRecent() {
    if (!adminToken.value) return;
    try {
        const res = await fetch("/api/admin/recent", {
            headers: {"x-admin-token": adminToken.value}
        });
        const data = await res.json();

        if (res.ok) {
            recent.value = data.submissions.map(s => typeof s === "string" ? JSON.parse(s) : s);
        } else {
            message.value = data.error || "Failed to load recent submissions";
        }
    } catch (err) {
        console.error(err);
        message.value = "Network error while loading recent submissions";
    }
}

async function loadBanned() {
    if (!adminToken.value) return;
    try {
        const res = await fetch("/api/admin/banned", {
            headers: { "x-admin-token": adminToken.value }
        });
        const data = await res.json();

        if (res.ok) {
            banned.value = data.bannedList;
        } else {
            message.value = data.error || "Failed to load banned list";
        }
    } catch (err) {
        console.error(err);
        message.value = "Network error while loading banned list";
    }
}


async function banIp(ipHash) {
    if (!confirm(`Ban ipHash: ${ipHash}?`)) return;
    const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken.value,
        },
        body: JSON.stringify({ ipHash, reason: "Manual ban" }),
    });
    const data = await res.json();
    message.value = JSON.stringify(data);
    await loadBanned();
}

async function banUsername(username) {
    if (!confirm(`Ban username: ${username}?`)) return;
    const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken.value,
        },
        body: JSON.stringify({ username, reason: "Manual ban" }),
    });
    const data = await res.json();
    message.value = JSON.stringify(data);
    await loadBanned();
}

onMounted(() => {
    adminToken.value = prompt("Enter admin token:");
    loadRecent();
    loadBanned();
});
</script>

<template>
    <div class="admin-panel">
        <h2>Admin Panel – Bans</h2>
        <p v-if="message">{{ message }}</p>

        <h3>Recent submissions</h3>
        <table v-if="recent.length">
            <thead>
            <tr>
                <th>Username</th>
                <th>Score</th>
                <th>ipHash</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="r in recent" :key="r.username + r.createdAt">
                <td>{{ r.username }}</td>
                <td>{{ r.score }}</td>
                <td style="font-family: monospace">{{ r.ipHash }}</td>
                <td>
                    <button @click="banUsername(r.username)">Ban by username</button>
                    <button @click="banIp(r.ipHash)">Ban IP</button>
                </td>
            </tr>
            </tbody>
        </table>

        <h3>Banned list</h3>
        <ul>
            <li v-for="ip in banned" :key="ip">
                {{ ip }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
.admin-panel {
    padding: 20px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 8px;
    max-width: 800px;
    margin: 0 auto;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
}
td, th {
    border: 1px solid #444;
    padding: 6px 10px;
}
button {
    margin: 0 4px;
    padding: 4px 8px;
    background: #d33;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
button:hover {
    background: #a22;
}
</style>
