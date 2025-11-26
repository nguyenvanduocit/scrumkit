<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps<{
	defaultValue?: string | number;
	modelValue?: string | number;
	class?: HTMLAttributes["class"];
}>();

const emits = defineEmits<{
	(e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
	passive: true,
	defaultValue: props.defaultValue,
});
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'input-polished flex h-10 w-full rounded-lg border border-border/50 bg-secondary-background selection:bg-main selection:text-main-foreground px-3 py-2 text-base font-medium text-foreground file:border-0 file:bg-transparent file:text-base file:font-semibold placeholder:text-foreground/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150',
        props.class
      )
    "
  />
</template>

<style scoped>
.input-polished {
  background: linear-gradient(
    145deg,
    oklch(32% 0.02 260) 0%,
    oklch(28% 0.02 260) 100%
  );
  border-top-color: oklch(100% 0 0 / 0.08);
  box-shadow:
    inset 0 2px 4px oklch(0% 0 0 / 0.2),
    0 1px 0 oklch(100% 0 0 / 0.05);
}

.input-polished:focus {
  box-shadow:
    inset 0 2px 4px oklch(0% 0 0 / 0.15),
    0 0 0 2px oklch(75% 0.18 85 / 0.3);
}
</style>
