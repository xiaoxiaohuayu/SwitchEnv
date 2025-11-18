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
  grid-template-columns: 360px 1fr;
  height: calc(100vh - 120px);
  background: var(--layout-panel-bg);
}

.sidebar {
  border-right: 1px solid var(--layout-divider);
  background: var(--card-bg);
}

.main {
  background: var(--content-bg);
  padding: 0;
}

@media (max-width: 1200px) {
  .app-shell {
    grid-template-columns: 320px 1fr;
  }
}
</style>
