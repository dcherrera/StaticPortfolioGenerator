<template>
  <q-page class="error-page">
    <div class="container">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <q-btn to="/" color="primary" unelevated label="Go Home" />
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
@import '../css/variables';

.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.container {
  text-align: center;

  h1 {
    font-size: 6rem;
    color: $text-muted;
    margin: 0;
  }

  p {
    color: $text-secondary;
    margin-bottom: $spacing-lg;
  }
}
</style>
