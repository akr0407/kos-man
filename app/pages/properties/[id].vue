<script setup lang="ts">
import { useKosStore } from '~/stores/kos'

const route = useRoute()
const router = useRouter()
const store = useKosStore()

// Make propertyId reactive to route changes
const propertyId = computed(() => route.params.id as string)
const property = computed(() => store.getPropertyById(propertyId.value))
const rooms = computed(() => store.getRoomsByPropertyId(propertyId.value))

const isRoomModalOpen = ref(false)
const selectedRoom = ref(undefined)

// Redirect if property not found (use watch to handle reactively)
watch(property, (newProperty) => {
  if (!newProperty && propertyId.value) {
    router.push('/properties')
  }
}, { immediate: true })

const openAddRoomModal = () => {
    selectedRoom.value = undefined
    isRoomModalOpen.value = true
}

const openEditRoomModal = (room: any) => {
    selectedRoom.value = room
    isRoomModalOpen.value = true
}

const deleteRoom = (id: string) => {
    if (confirm('Are you sure? This will delete the room and its billing history.')) {
        store.deleteRoom(id)
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'available': return 'green'
        case 'occupied': return 'red'
        case 'maintenance': return 'orange'
        default: return 'gray'
    }
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div v-if="property" class="p-6 space-y-6">
    <!-- Breadcrumb & Header -->
    <div>
        <UButton to="/properties" variant="ghost" icon="i-heroicons-arrow-left" class="mb-4">Back to Properties</UButton>

        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="flex gap-6">
                <img :src="property.image" class="w-24 h-24 rounded-lg object-cover shadow-sm bg-gray-100" />
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ property.name }}</h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-1">{{ property.address }}</p>
                    <p class="text-sm text-gray-400 mt-2">{{ property.description }}</p>
                </div>
            </div>
            <UButton icon="i-heroicons-plus" size="lg" @click="openAddRoomModal">Add Room</UButton>
        </div>
    </div>

    <!-- Rooms List -->
    <div>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Rooms ({{ rooms.length }})</h2>
            <UButton :to="`/rooms?propertyId=${propertyId}`" variant="soft" color="primary" size="sm" icon="i-heroicons-list-bullet">
                Manage All Rooms
            </UButton>
        </div>

        <div v-if="rooms.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <UCard
                v-for="room in rooms"
                :key="room.id"
                class="hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer"
                @click="navigateTo(`/rooms/${room.id}`)"
            >
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-bold">{{ room.name }}</h3>
                    <UBadge :color="getStatusColor(room.status)" variant="subtle">{{ room.status }}</UBadge>
                </div>

                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div class="flex justify-between">
                        <span>Price:</span>
                        <span class="font-medium">{{ formatCurrency(room.price) }}</span>
                    </div>
                    <div v-if="room.tenantName" class="flex justify-between text-primary-600 dark:text-primary-400">
                        <span>Tenant:</span>
                        <span class="font-bold">{{ room.tenantName }}</span>
                    </div>
                    <div v-else class="text-gray-400 italic">
                        No tenant
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                    <UButton size="xs" color="white" icon="i-heroicons-pencil-square" @click.stop="openEditRoomModal(room)">Edit</UButton>
                    <UButton size="xs" color="red" variant="ghost" icon="i-heroicons-trash" @click.stop="deleteRoom(room.id)" />
                </div>
            </UCard>
        </div>

        <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p class="text-gray-500 mb-4">No rooms added yet to this property.</p>
            <UButton variant="outline" icon="i-heroicons-plus" @click="openAddRoomModal">Add First Room</UButton>
        </div>
    </div>

    <RoomModal v-model="isRoomModalOpen" :property-id="propertyId" :room="selectedRoom" />
  </div>
</template>
