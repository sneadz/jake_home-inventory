<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

type Item = {
  id: number;
  name: string;
  quantity: number;
  expiration_date: string | null;
  created_at: string;
};

const items = ref<Item[]>([]);
const loading = ref(true);

const name = ref("");
const quantity = ref(0);
const expirationDate = ref("");

// Gestion du thème
const isDark = ref(localStorage.getItem("theme") === "dark");

function toggleTheme() {
  isDark.value = !isDark.value;
}

watch(isDark, (val) => {
  localStorage.setItem("theme", val ? "dark" : "light");
  if (val) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, { immediate: true });

async function loadItems() {
  const res = await fetch("/api/items");
  items.value = await res.json();
  loading.value = false;
}

async function addItem() {
  if (!name.value) return;

  await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.value,
      quantity: quantity.value,
      expiration_date: expirationDate.value || null,
    }),
  });

  name.value = "";
  quantity.value = 0;
  expirationDate.value = "";
  await loadItems();
}

async function deleteItem(id: number) {
  if (!confirm("Supprimer ce produit ?")) return;
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  await loadItems();
}

async function updateQuantity(item: Item, delta: number) {
  const newQuantity = Math.max(0, item.quantity + delta);
  if (newQuantity === item.quantity) return;

  await fetch(`/api/items/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: newQuantity }),
  });
  await loadItems();
}

function sortByAlpha() {
  items.value.sort((a, b) => a.name.localeCompare(b.name));
}

function sortByExpiration() {
  items.value.sort((a, b) => {
    if (!a.expiration_date) return 1;
    if (!b.expiration_date) return -1;
    return a.expiration_date.localeCompare(b.expiration_date);
  });
}

onMounted(loadItems);
</script>

<template>
  <div :class="{ 'dark-theme': isDark }" class="app-container">
    <main class="content">
      <header>
        <h1>Inventaire</h1>
        <button @click="toggleTheme" class="theme-toggle">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </header>

      <section class="add-form">
        <form @submit.prevent="addItem">
          <div class="input-group">
            <input
                v-model="name"
                placeholder="Nom du produit"
                required
            />
          </div>

          <div class="input-group row">
            <input
                v-model.number="quantity"
                type="number"
                min="0"
                placeholder="Qté"
                class="qty-input"
            />
            <input
                v-model="expirationDate"
                type="date"
                class="date-input"
            />
          </div>

          <button type="submit" class="btn-add">Ajouter au stock</button>
        </form>
      </section>

      <section v-if="items.length > 0" class="actions">
        <button @click="sortByAlpha" class="btn-sort">Trier A-Z</button>
        <button @click="sortByExpiration" class="btn-sort">Trier Date</button>
      </section>

      <section class="list-section">
        <p v-if="loading" class="status-msg">Chargement...</p>
        <p v-else-if="items.length === 0" class="status-msg">Aucun produit en stock.</p>
        
        <ul v-else class="item-list">
          <li v-for="item in items" :key="item.id" class="item-card">
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-expiry" v-if="item.expiration_date">📅 {{ item.expiration_date }}</span>
            </div>
            
            <div class="item-controls">
              <div class="qty-controls">
                <button @click="updateQuantity(item, -1)" class="btn-qty">-</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button @click="updateQuantity(item, 1)" class="btn-qty">+</button>
              </div>
              <button @click="deleteItem(item.id)" class="btn-delete">🗑️</button>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-color: #212529;
  --text-muted: #6c757d;
  --primary-color: #4dabf7;
  --primary-hover: #339af0;
  --danger-color: #ff6b6b;
  --border-color: #dee2e6;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark-theme,
:root.dark {
  --bg-color: #1a1b1e;
  --card-bg: #25262b;
  --text-color: #c1c2c5;
  --text-muted: #909296;
  --primary-color: #1c7ed6;
  --primary-hover: #1971c2;
  --danger-color: #fa5252;
  --border-color: #373a40;
  --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  transition: background-color 0.3s, color 0.3s;
}

.app-container {
  min-height: 100vh;
  padding: 1rem;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

.content {
  max-width: 500px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(45deg, var(--primary-color), #51cf66);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.add-form {
  background: var(--card-bg);
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group.row {
  display: flex;
  gap: 0.75rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
}

.qty-input {
  flex: 1;
}

.date-input {
  flex: 2;
}

.btn-add {
  width: 100%;
  padding: 0.8rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--primary-hover);
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn-sort {
  flex: 1;
  padding: 0.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.status-msg {
  text-align: center;
  color: var(--text-muted);
  margin-top: 2rem;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-card {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.item-expiry {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.qty-controls {
  display: flex;
  align-items: center;
  background: var(--bg-color);
  border-radius: 8px;
  padding: 0.25rem;
}

.btn-qty {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.qty-value {
  padding: 0 0.75rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.btn-delete {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: rgba(250, 82, 82, 0.1);
}

/* Mobile adjustments */
@media (max-width: 400px) {
  .item-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .item-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
