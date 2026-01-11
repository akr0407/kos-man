<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue?: string | null
  granularity?: 'day' | 'month'
}>(), {
  granularity: 'day'
})

const emit = defineEmits(['update:modelValue'])

const date = ref<CalendarDate | null>(null)

// Sync from string prop to CalendarDate
watch(() => props.modelValue, (val) => {
  if (val) {
     let parts = val.split('-')
     // Handle YYYY-MM for month granularity
     if (props.granularity === 'month' && parts.length === 2) {
         parts.push('01')
     }

     if (parts.length === 3) {
         try {
            date.value = new CalendarDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]))
         } catch (e) {
            console.error('Invalid date format', val)
         }
         return
     }
  }
  date.value = null
}, { immediate: true })

// Sync from CalendarDate to string prop
watch(date, (val) => {
  if (val) {
    if (props.granularity === 'month') {
        // Emit YYYY-MM
        emit('update:modelValue', `${val.year}-${String(val.month).padStart(2, '0')}`)
    } else {
        emit('update:modelValue', val.toString())
    }
  } else {
    emit('update:modelValue', null)
  }
})
</script>

<template>
  <UInputDate v-model="date" :granularity="granularity">
    <template #trailing>
       <UPopover :ui="{ content: 'p-2' }">
          <UButton color="neutral" variant="link" icon="i-heroicons-calendar" class="p-0" />
          <template #content>
             <UCalendar v-model="date" :granularity="granularity" />
          </template>
       </UPopover>
    </template>
  </UInputDate>
</template>
