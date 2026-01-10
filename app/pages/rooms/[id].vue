<script setup lang="ts">
import { z } from 'zod'
import { useKosStore, type Bill } from '~/stores/kos'

const route = useRoute()
const router = useRouter()
const store = useKosStore()

// Make roomId reactive to route changes
const roomId = computed(() => route.params.id as string)
const { rooms, bills, tenants, properties, settings } = storeToRefs(store)
const room = computed(() => rooms.value.find(r => r.id === roomId.value))

const roomBills = computed(() => store.getBillsByRoomId(roomId.value).sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()))

// Redirect if room not found (use watch to handle reactively)
watch(room, (newRoom) => {
  if (!newRoom && roomId.value) {
    router.push('/properties')
  }
}, { immediate: true })

// ============ Room Status & Tenant Management ============
const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' }
]

const roomStatus = ref(room.value?.status || 'available')
const useTrashService = ref(room.value?.useTrashService ?? true)
const selectedTenantId = ref<string | null>(null)
const isCreatingNewTenant = ref(false)
const newTenantName = ref('')
const newTenantContact = ref('')
const newTenantIdCard = ref('')

// Tenant options for select dropdown
const tenantOptions = computed(() => {
  return [
    { label: '-- No Tenant --', value: '' },
    ...tenants.value.map(t => ({ label: t.name, value: t.id })),
    { label: '+ Create New Tenant', value: '__new__' }
  ]
})

// Initialize selected tenant
watch(room, (r) => {
  if (r) {
    roomStatus.value = r.status
    useTrashService.value = r.useTrashService ?? true
    // Find tenant by name
    const tenant = tenants.value.find(t => t.name === r.tenantName)
    selectedTenantId.value = tenant?.id || null
  }
}, { immediate: true })

// Watch for "Create New" selection
watch(selectedTenantId, (val) => {
  if (val === '__new__') {
    isCreatingNewTenant.value = true
  } else {
    isCreatingNewTenant.value = false
  }
})

const updateRoomStatus = () => {
  if (!room.value) return
  
  let tenantName = ''
  
  if (roomStatus.value === 'occupied') {
    if (isCreatingNewTenant.value && newTenantName.value) {
      // Create new tenant first
      store.addTenant({
        name: newTenantName.value,
        contact: newTenantContact.value || '0000000000',
        idCardNumber: newTenantIdCard.value || '0000000000000000',
        status: 'active',
        roomId: roomId.value
      })
      tenantName = newTenantName.value
      
      // Reset new tenant form
      newTenantName.value = ''
      newTenantContact.value = ''
      newTenantIdCard.value = ''
      isCreatingNewTenant.value = false
      selectedTenantId.value = null
      
      useToast().add({ title: 'Tenant Created', description: 'New tenant has been created and assigned.', color: 'success' })
    } else if (selectedTenantId.value && selectedTenantId.value !== '__new__') {
      const tenant = tenants.value.find(t => t.id === selectedTenantId.value)
      tenantName = tenant?.name || ''
      
      if (tenant) {
        store.updateTenant(tenant.id, { roomId: roomId.value })
      }
    }
  }
  
  store.updateRoom(roomId.value, {
    status: roomStatus.value as 'available' | 'occupied' | 'maintenance',
    tenantName: roomStatus.value === 'occupied' ? tenantName : undefined,
    useTrashService: useTrashService.value
  })
  
  useToast().add({ title: 'Room Updated', description: 'Room status has been updated.', color: 'success' })
}

// ============ Billing Form ============
const formState = reactive({
  period: new Date().toISOString().slice(0, 7), // YYYY-MM
  meterStart: 0,
  meterEnd: 0
})

// Auto-fill previous meter functionality
watch(roomBills, (newBills) => {
    if (newBills.length > 0) {
        formState.meterStart = newBills[0].meterEnd
        formState.meterEnd = newBills[0].meterEnd
    } else {
        formState.meterStart = 0
    }
}, { immediate: true })

// Calculation using property settings
const property = computed(() => properties.value.find(p => p.id === room.value?.propertyId))
const effectiveSettings = computed(() => {
    return property.value?.settings || settings.value
})

const usage = computed(() => {
    const val = formState.meterEnd - formState.meterStart
    return val > 0 ? val : 0
})
const electricityCost = computed(() => usage.value * effectiveSettings.value.costPerKwh)
const waterCost = computed(() => effectiveSettings.value.waterFee)
const trashCost = computed(() => useTrashService.value ? effectiveSettings.value.trashFee : 0)
const additionalCost = computed(() => waterCost.value + trashCost.value)
const totalBillPrediction = computed(() => (room.value?.price || 0) + electricityCost.value + additionalCost.value)

// Submit Bill
const generateBill = () => {
    try {
        store.generateBill({
            roomId: roomId.value,
            period: formState.period,
            meterStart: formState.meterStart,
            meterEnd: formState.meterEnd,
            costPerKwh: effectiveSettings.value.costPerKwh,
            additionalCost: additionalCost.value
        })
        useToast().add({ title: 'Bill Generated', description: 'The bill has been saved successfully.', color: 'success' })
        
        // Reset form slightly for next month
        formState.meterStart = formState.meterEnd
    } catch (e: any) {
        useToast().add({ title: 'Error', description: e.message, color: 'error' })
    }
}

const deleteBill = (id: string) => {
    if (confirm('Delete this bill?')) {
        store.deleteBill(id)
    }
}

const markPaid = (id: string) => {
    store.markBillAsPaid(id)
}

// Helpers
const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const getStatusColor = (status: string) => {
  switch(status) {
    case 'available': return 'success'
    case 'occupied': return 'primary'
    case 'maintenance': return 'warning'
    default: return 'neutral'
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(`/properties/${room.value?.propertyId || ''}`)
  }
}
</script>

<template>
  <div v-if="room" class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Navigation & Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
            <UButton @click="goBack" variant="link" color="neutral" icon="i-heroicons-arrow-left" class="p-0 mb-2">
                Back
            </UButton>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ room.name }}</h1>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage room details, tenant, and billing.</p>
        </div>
        <div class="flex items-center gap-3">
             <div class="text-right hidden sm:block">
                <div class="text-sm text-gray-500">Monthly Rent</div>
                <div class="text-xl font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(room.price) }}</div>
             </div>
             <UBadge :color="getStatusColor(room.status)" size="lg" variant="solid" class="capitalize px-3 py-1.5">
                {{ room.status }}
             </UBadge>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- LEFT COLUMN: Billing (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
            
            <!-- Billing Tabs -->
            <UTabs :items="[{ label: 'Create Bill', slot: 'create' }, { label: 'History', slot: 'history' }]" class="w-full">
                
                <!-- Create Bill Tab -->
                <template #create>
                    <UCard class="mt-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <form @submit.prevent="generateBill" class="space-y-5">
                                <div class="space-y-1">
                                    <label class="text-sm font-medium">Billing Period</label>
                                    <UInput v-model="formState.period" type="month" icon="i-heroicons-calendar" />
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1">
                                        <label class="text-sm font-medium">Start (kWh)</label>
                                        <UInput v-model="formState.meterStart" type="number" />
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-sm font-medium">End (kWh)</label>
                                        <UInput v-model="formState.meterEnd" type="number" />
                                    </div>
                                </div>

                                <!-- Global Rates (read-only info) -->
                                <div class="bg-primary-50 dark:bg-primary-950/30 p-3 rounded-lg text-sm space-y-1">
                                    <div class="flex justify-between text-primary-700 dark:text-primary-400">
                                        <span>Electricity Rate:</span>
                                        <span class="font-medium">Rp {{ effectiveSettings.costPerKwh.toLocaleString() }} / kWh</span>
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        {{ property?.settings ? 'Using Property Settings' : 'Using Global Settings' }}
                                    </div>
                                </div>
                                
                                <UButton type="submit" block color="neutral" size="lg" class="mt-6" :disabled="usage < 0">
                                    Generate Bill
                                </UButton>
                            </form>

                            <!-- Live Preview -->
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 flex flex-col justify-center">
                                <h4 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Bill Preview</h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Base Rent</span>
                                        <span class="font-medium">{{ formatCurrency(room.price) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Electricity ({{ usage }} kWh)</span>
                                        <span class="font-medium">{{ formatCurrency(electricityCost) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Water</span>
                                        <span class="font-medium">{{ formatCurrency(waterCost) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">
                                            Trash 
                                            <span v-if="!useTrashService" class="text-xs text-orange-500">(disabled)</span>
                                        </span>
                                        <span class="font-medium">{{ formatCurrency(trashCost) }}</span>
                                    </div>
                                    <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                    <div class="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span>{{ formatCurrency(totalBillPrediction) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </UCard>
                </template>

                <!-- History Tab -->
                <template #history>
                     <UCard class="mt-4">
                        <div v-if="roomBills.length > 0">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th class="p-3 font-medium">Period</th>
                                        <th class="p-3 font-medium">Usage</th>
                                        <th class="p-3 font-medium">Total</th>
                                        <th class="p-3 font-medium">Status</th>
                                        <th class="p-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr v-for="bill in roomBills" :key="bill.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                        <td class="p-3 font-medium">{{ bill.period }}</td>
                                        <td class="p-3">
                                            <div>{{ bill.meterEnd - bill.meterStart }} kWh</div>
                                            <div class="text-xs text-gray-400 font-mono">{{ bill.meterStart }} -> {{ bill.meterEnd }}</div>
                                        </td>
                                        <td class="p-3 font-bold text-gray-900 dark:text-white">{{ formatCurrency(bill.totalAmount) }}</td>
                                        <td class="p-3">
                                            <UBadge :color="bill.isPaid ? 'success' : 'neutral'" variant="subtle" size="xs">
                                                {{ bill.isPaid ? 'Paid' : 'Unpaid' }}
                                            </UBadge>
                                        </td>
                                        <td class="p-3 text-right flex justify-end gap-1">
                                            <UTooltip text="Mark as Paid" v-if="!bill.isPaid">
                                                <UButton size="xs" color="success" variant="soft" icon="i-heroicons-check" @click="markPaid(bill.id)" />
                                            </UTooltip>
                                            <UTooltip text="Delete">
                                                <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash" @click="deleteBill(bill.id)" />
                                            </UTooltip>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="text-center py-12">
                            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-gray-400" />
                            </div>
                            <p class="text-gray-500 text-sm">No billing history recorded yet.</p>
                        </div>
                    </UCard>
                </template>
            </UTabs>
        </div>

        <!-- RIGHT COLUMN: Room Settings & Tenant (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
            <!-- Room Settings Card -->
            <UCard class="ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm">
                <template #header>
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-gray-500" />
                        <h3 class="font-semibold text-gray-900 dark:text-white">Room Settings</h3>
                    </div>
                </template>

                <div class="space-y-4">
                    <div class="space-y-1">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <USelect 
                          v-model="roomStatus" 
                          :items="statusOptions" 
                          value-key="value" 
                          label-key="label"
                          class="w-full"
                        />
                    </div>

                    <!-- Tenant Management -->
                    <div v-if="roomStatus === 'occupied'" class="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                         <div class="space-y-1">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant</label>
                            
                            <!-- Current Tenant Display if assigned -->
                            <div v-if="room.tenantName && !isCreatingNewTenant && !selectedTenantId" class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md flex items-center justify-between group">
                                <div class="flex items-center gap-3">
                                    <UAvatar :alt="room.tenantName" size="sm" class="bg-primary-100 text-primary-600" />
                                    <div class="text-sm font-medium">{{ room.tenantName }}</div>
                                </div>
                                <UButton variant="ghost" color="neutral" icon="i-heroicons-pencil-square" size="xs" class="opacity-0 group-hover:opacity-100" @click="selectedTenantId = ''" />
                            </div>

                            <!-- Selection Dropdown -->
                            <div v-else>
                                <USelectMenu 
                                v-model="selectedTenantId" 
                                :items="tenantOptions" 
                                value-key="value" 
                                label-key="label"
                                class="w-full"
                                placeholder="Select or create tenant..."
                                />
                            </div>
                        </div>

                        <!-- New Tenant Form -->
                        <div v-if="isCreatingNewTenant" class="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-lg space-y-3 border border-primary-100 dark:border-primary-900/50">
                            <div class="flex items-center justify-between text-sm font-medium text-primary-700 dark:text-primary-400 mb-2">
                                <span class="flex items-center gap-1"><UIcon name="i-heroicons-user-plus" /> New Tenant</span>
                                <UButton variant="ghost" color="neutral" icon="i-heroicons-x-mark" size="xs" @click="isCreatingNewTenant = false; selectedTenantId = null" />
                            </div>
                            
                            <UFormField label="Full Name">
                                <UInput v-model="newTenantName" placeholder="e.g. Budi Santoso" size="sm" class="w-full" />
                            </UFormField>
                            <UFormField label="Contact">
                                <UInput v-model="newTenantContact" placeholder="08..." size="sm" class="w-full" />
                            </UFormField>
                            <UFormField label="KTP Number">
                                <UInput v-model="newTenantIdCard" placeholder="16 digits" maxlength="16" size="sm" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <!-- Trash Service Toggle -->
                    <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Trash Service</div>
                                <div class="text-xs text-gray-500">Include trash fee ({{ formatCurrency(effectiveSettings.trashFee) }}/mo)</div>
                            </div>
                            <USwitch v-model="useTrashService" />
                        </div>
                    </div>

                    <UButton @click="updateRoomStatus" block color="primary" class="mt-4" :loading="false">
                        Save Changes
                    </UButton>
                </div>
            </UCard>
            
            <!-- Quick Stats / Info could go here -->
        </div>
    </div>
  </div>
</template>
