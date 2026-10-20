<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { ref } from 'vue';
import { SpSelect } from '@silverpoint/vue/ui/select';

const value = ref<string>();
</script>

<template>
  <SpSelect
    label="Status"
    name="status"
    :items="[{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid' }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }, { key: 'returned', label: 'Returned', disabled: true }]"
    v-model="value"
  />
</template>
