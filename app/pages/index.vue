<script setup lang="ts">
// Redirect based on auth
if (import.meta.client) {
  const isAuthenticated = localStorage.getItem('kos-man-auth') === 'true'
  if (isAuthenticated) {
     await navigateTo('/properties')
  } else {
     await navigateTo('/login')
  }
} else {
    // Server side default to login for safety, or properties if we had cookie
    await navigateTo('/login')
}
</script>
<template>
  <div>Redirecting...</div>
</template>
