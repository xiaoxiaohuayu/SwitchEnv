<template>
  <div class="app-shell">
    <div class="sidebar">
      <slot name="sidebar" />
    </div>
    <div class="main">
      <slot name="main" />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: calc(100vh - 60px); /* Adjusted for new header height */
  background: var(--layout-panel-bg);
  overflow: hidden;
}

.sidebar {
  border-right: 1px solid var(--layout-divider);
  background: var(--app-card-bg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.main {
  background: var(--content-bg);
  padding: 0;
  overflow-y: auto;
  position: relative;
}

@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 280px 1fr;
  }
}
</style>
