<script setup lang="ts">
import type { RenderedChart } from '@silverpoint/grounds';
import ChartSvg from './ChartSvg.vue';

/** The chart's DOM: root, SVG, overlay slot and tabular alternative (API Spec §10). */
defineProps<{ rendered: RenderedChart; rootClass: string }>();
</script>

<template>
  <div
    :class="rootClass"
    :data-substrate="rendered.substrate"
    :data-chrome="rendered.chrome"
    :data-status="rendered.status"
  >
    <ChartSvg :view="rendered.view" />
    <slot />
    <div v-if="rendered.dataTable !== 'none'" class="sp-table-box" :data-visibility="rendered.dataTable">
      <table
        class="sp-table"
        :id="rendered.ids.table"
        :data-visibility="rendered.dataTable"
      >
        <caption>{{ rendered.table.caption }}</caption>
        <thead>
          <tr>
            <th v-for="(column, index) in rendered.table.columns" :key="index" scope="col">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rendered.table.rows" :key="index">
            <template v-for="(cell, column) in row" :key="column">
              <th v-if="column === 0" scope="row">{{ cell }}</th>
              <td v-else>{{ cell }}</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
