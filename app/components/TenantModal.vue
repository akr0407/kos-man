<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useKosStore, type Tenant } from '~/stores/kos'

const props = defineProps<{
  modelValue: boolean
  tenant?: Tenant
}>()

const emit = defineEmits(['update:modelValue'])

const store = useKosStore()

const state = reactive({
  name: '',
  contact: '',
  idCardNumber: '',
  status: 'active' as 'active' | 'inactive'
})

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact: z.string().min(10, 'Contact number is too short').regex(/^\d+$/, 'Must be numbers only'),
  idCardNumber: z.string().min(16, 'ID Card (KTP) must be 16 digits'),
  status: z.enum(['active', 'inactive'])
})

type Schema = z.output<typeof schema>

watch(() => props.tenant, (newVal) => {
  if (newVal) {
    state.name = newVal.name
    state.contact = newVal.contact
    state.idCardNumber = newVal.idCardNumber
    state.status = newVal.status
  } else {
    state.name = ''
    state.contact = ''
    state.idCardNumber = ''
    state.status = 'active'
  }
}, { immediate: true })

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const data = event.data as any
  if (props.tenant) {
    store.updateTenant(props.tenant.id, data)
  } else {
    store.addTenant(data)
  }
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="tenant ? 'Edit Tenant' : 'Add New Tenant'">
    <template #default />
    
    <template #content>
      <div class="p-6">
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <UInput 
              v-model="state.name" 
              placeholder="e.g. John Doe" 
              autofocus 
              class="w-full"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
            <UInput 
              v-model="state.contact" 
              placeholder="0812..." 
              type="tel" 
              class="w-full"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Card Number (KTP)</label>
            <UInput 
              v-model="state.idCardNumber" 
              placeholder="16 digits" 
              maxlength="16" 
              class="w-full"
            />
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

          <div class="flex justify-end gap-3 mt-6">
            <UButton label="Cancel" color="neutral" variant="ghost" @click="isOpen = false" />
            <UButton type="submit" label="Save Tenant" color="primary" />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
