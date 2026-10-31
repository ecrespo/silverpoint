<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@silverpoint/marp/deck.css';
import { ref } from 'vue';
import { SpDeck } from '@silverpoint/vue/deck';

const markdown = `# Quarterly review

\`\`\`silverpoint
{"chart":"bar-chart","props":{"title":"Visits"}}
\`\`\`

---

## Next steps

* Ship it`;
const page = ref(1);
</script>

<template>
  <SpDeck
    :markdown="markdown"
    v-model:page="page"
    ground="cyanotype"
    :hash="true"
  />
</template>
