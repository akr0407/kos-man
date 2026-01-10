<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useKosStore } from '~/stores/kos'

const store = useKosStore()
const { settings } = storeToRefs(store)

// Use local state for form editing
const state = reactive({
  costPerKwh: settings.value.costPerKwh,
  waterFee: settings.value.waterFee,
  trashFee: settings.value.trashFee
})

const schema = z.object({
  costPerKwh: z.number().min(0),
  waterFee: z.number().min(0),
  trashFee: z.number().min(0)
})

type Schema = z.output<typeof schema>

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  store.updateSettings(event.data)
  const toast = useToast()
  toast.add({ title: 'Settings Saved', description: 'Global billing rates have been updated.', color: 'success' })
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Global Settings</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Manage default billing rates used across your properties.</p>
      </div>
      <UButton type="submit" size="lg" color="primary" class="px-8" @click="onSubmit({ data: state } as any)">
        Save Changes
      </UButton>
    </div>

    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Electricity Card -->
        <div class="relative group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                <UIcon name="i-heroicons-bolt" class="w-8 h-8" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Electricity Rate</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Base cost per kilowatt-hour (kWh) for room usage.</p>
          </div>
          
          <UFormField label="Cost per kWh" class="mt-auto">
            <UInput v-model="state.costPerKwh" type="number" step="100" size="lg">
              <template #leading>Rp</template>
            </UInput>
          </UFormField>
        </div>

        <!-- Water Card -->
        <div class="relative group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <!-- Changed from 'drop' to 'beaker' as generic liquid icon since 'drop' might not exist in set -->
                <UIcon name="i-heroicons-beaker" class="w-8 h-8" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Water Fee</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Flat monthly water charge per room.</p>
          </div>
          
          <UFormField label="Monthly Fee" class="mt-auto">
            <UInput v-model="state.waterFee" type="number" step="1000" size="lg">
              <template #leading>Rp</template>
            </UInput>
          </UFormField>
        </div>

        <!-- Trash Card -->
        <div class="relative group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                <UIcon name="i-heroicons-trash" class="w-8 h-8" />
              </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Trash Fee</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Standard monthly trash collection service fee.</p>
          </div>
          
          <UFormField label="Monthly Fee" class="mt-auto">
            <UInput v-model="state.trashFee" type="number" step="1000" size="lg">
              <template #leading>Rp</template>
            </UInput>
          </UFormField>
        </div>

      </div>
    </UForm>
    
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center gap-4 text-sm text-gray-500 border border-gray-100 dark:border-gray-800">
      <UIcon name="i-heroicons-information-circle" class="w-5 h-5 shrink-0" />
      <p>These settings serve as defaults. You can override them for specific properties by enabling "Custom Rates" in the Property Edit menu.</p>
    </div>
  </div>
</template>
