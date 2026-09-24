<script setup lang="ts">
import type { SvgView } from '@silverpoint/core';
import ChartPath from './ChartPath.vue';

/** Writes the core's SVG view one field to one attribute; computes nothing (Art. 2). */
defineProps<{ view: SvgView }>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="view.svg.viewBox"
    :width="view.svg.width"
    :height="view.svg.height"
    :class="view.svg.class"
    :data-substrate="view.svg.substrate"
    :data-mode="view.svg.mode"
    :role="view.svg.role"
    :aria-labelledby="view.svg.labelledby"
  >
    <title :id="view.title.id">{{ view.title.text }}</title>
    <desc :id="view.desc.id">{{ view.desc.text }}</desc>
    <defs v-if="view.patterns.length > 0">
      <pattern
        v-for="pattern in view.patterns"
        :key="pattern.id"
        :id="pattern.id"
        :width="pattern.width"
        :height="pattern.height"
        patternUnits="userSpaceOnUse"
        :patternTransform="pattern.transform"
      >
        <ChartPath v-for="(path, index) in pattern.paths" :key="index" :path="path" />
      </pattern>
    </defs>
    <ChartPath v-for="(path, index) in view.paths" :key="index" :path="path" />
    <text
      v-for="(text, index) in view.texts"
      :key="index"
      :x="text.x"
      :y="text.y"
      :part="text.part"
      :data-kind="text.kind"
      :text-anchor="text.anchor"
    >{{ text.text }}</text>
  </svg>
</template>
