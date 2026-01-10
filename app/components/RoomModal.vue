<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useKosStore, type Room } from '~/stores/kos'

const props = defineProps<{
  modelValue: boolean
  propertyId: string
  room?: Room
}>()

const emit = defineEmits(['update:modelValue'])

const store = useKosStore()

const state = reactive({
  name: '',
  price: 0,
  status: 'available' as 'available' | 'occupied' | 'maintenance',
  tenantName: ''
})

const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' }
]

const schema = z.object({
  name: z.string().min(1, 'Room name is required'),
  price: z.number().min(0, 'Price must be positive'),
  status: z.enum(['available', 'occupied', 'maintenance']),
  tenantName: z.string().optional()
})

type Schema = z.output<typeof schema>

watch(() => props.room, (newVal) => {
  if (newVal) {
    state.name = newVal.name
    state.price = newVal.price
    state.status = newVal.status
    state.tenantName = newVal.tenantName || ''
  } else {
    state.name = ''
    state.price = 1000000
    state.status = 'available'
    state.tenantName = ''
  }
}, { immediate: true })

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const data = event.data as any
  if (props.room) {
    store.updateRoom(props.room.id, data)
  } else {
    store.addRoom({
        ...data,
        propertyId: props.propertyId
    })
  }
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="room ? 'Edit Room' : 'Add New Room'">
    <template #default />
    
    <template #content>
      <div class="p-6">
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Name/Number</label>
            <UInput v-model="state.name" placeholder="e.g. 101" autofocus class="w-full" />
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Price (Monthly)</label>
            <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500 text-sm">Rp</span>
                <UInput v-model="state.price" type="number" placeholder="0" class="pl-8 w-full" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <USelect 
              v-model="state.status" 
              :items="statusOptions" 
              value-key="value" 
              label-key="label"
              class="w-full"
            />
          </div>

          <div v-if="state.status === 'occupied'" class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tenant Name</label>
            <UInput v-model="state.tenantName" placeholder="Name of tenant" class="w-full" />
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="isOpen = false" />
            <UButton type="submit" label="Save Room" color="primary" />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
