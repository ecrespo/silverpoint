import { onMounted, ref, watch, type Ref } from 'vue';

/** The native checkbox, for its `indeterminate` property: set once mounted, so both renders agree. */
export function useIndeterminate(indeterminate: () => boolean | undefined): Ref<HTMLInputElement | undefined> {
  const element = ref<HTMLInputElement>();
  const apply = () => {
    if (element.value) element.value.indeterminate = indeterminate() === true;
  };
  onMounted(apply);
  watch(indeterminate, apply);
  return element;
}
