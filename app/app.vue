<script setup lang="ts">
const colorMode = useColorMode()

useHead(() => ({
    meta: [{
        name: 'theme-color',
        content: colorMode.value === 'dark' ? '#121915' : '#faf9f6',
    }],
}))
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
