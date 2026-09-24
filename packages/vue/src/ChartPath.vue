<script setup lang="ts">
import type { PathView } from '@silverpoint/core';

defineProps<{ path: PathView }>();
</script>

<template>
  <path
    :d="path.d"
    :part="path.part"
    :data-role="path.role"
    :data-paint="path.paint"
    :data-dash="path.dash ?? undefined"
    :fill="path.fill ?? undefined"
  />
</template>
