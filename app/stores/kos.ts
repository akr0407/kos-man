import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PropertySettings {
    costPerKwh: number
    trashFee: number
    waterFee: number
}

export interface Property {
    id: string
    name: string
    address: string
    description: string
    image: string
    settings?: PropertySettings // Optional: if undefined, use global settings
}

export interface Room {
    id: string
    propertyId: string
    name: string
    price: number
    status: 'available' | 'occupied' | 'maintenance'
    tenantName?: string
    useTrashService?: boolean // Enable/disable trash fee for this room
}

export interface GlobalSettings {
    costPerKwh: number
    trashFee: number
    waterFee: number
}

export interface Bill {
    id: string
    roomId: string
    period: string // YYYY-MM
    meterStart: number
    meterEnd: number
    costPerKwh: number
    usageCost: number // calculated
    additionalCost: number // water, wifi, etc.
    totalAmount: number
    isPaid: boolean
    generatedAt: string
}

export interface Tenant {
    id: string
    name: string
    contact: string
    idCardNumber: string // KTP
    status: 'active' | 'inactive'
    roomId?: string // Optional link to a room
}

export const useKosStore = defineStore('kos', () => {
    // --- State ---
    const properties = useLocalStorage<Property[]>('kos-man-properties', [
        {
            id: '1',
            name: 'Kos Sejahtera 1',
            address: 'Jl. Merdeka No. 10, Jakarta Selatan',
            description: 'Kos nyaman dengan fasilitas lengkap, dekat stasiun MRT.',
            image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
            // No settings -> uses global
        },
        {
            id: '2',
            name: 'Kos Bahagia 2',
            address: 'Jl. Anggrek No. 5, Bandung',
            description: 'Lingkungan asri dan sejuk, cocok untuk mahasiswa.',
            image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
            settings: { costPerKwh: 2000, trashFee: 30000, waterFee: 60000 } // Custom override example
        }
    ])

    const rooms = useLocalStorage<Room[]>('kos-man-rooms', [
        { id: '101', propertyId: '1', name: 'Room 101', price: 1500000, status: 'occupied', tenantName: 'Budi Santoso' },
        { id: '102', propertyId: '1', name: 'Room 102', price: 1500000, status: 'available' },
        { id: '103', propertyId: '1', name: 'Room 103', price: 1750000, status: 'maintenance' },
        { id: '201', propertyId: '2', name: 'Room A1', price: 1200000, status: 'occupied', tenantName: 'Siti Aminah' },
    ])

    const bills = useLocalStorage<Bill[]>('kos-man-bills', [])

    const tenants = useLocalStorage<Tenant[]>('kos-man-tenants', [
        { id: '1', name: 'Budi Santoso', contact: '08123456789', idCardNumber: '3201234567890001', status: 'active', roomId: '101' },
        { id: '2', name: 'Siti Aminah', contact: '081987654321', idCardNumber: '3201234567890002', status: 'active', roomId: '201' }
    ])

    // Global Settings
    const settings = useLocalStorage<GlobalSettings>('kos-man-settings', {
        costPerKwh: 1500,
        trashFee: 25000,
        waterFee: 50000
    })

    // --- Actions ---

    // Settings
    function updateSettings(updates: Partial<GlobalSettings>) {
        settings.value = { ...settings.value, ...updates }
    }

    // Properties
    function addProperty(property: Omit<Property, 'id'>) {
        const id = Date.now().toString()
        properties.value.push({ ...property, id })
    }

    function updateProperty(id: string, updates: Partial<Property>) {
        const index = properties.value.findIndex(p => p.id === id)
        if (index !== -1) {
            properties.value[index] = { ...properties.value[index], ...updates }
        }
    }

    function deleteProperty(id: string) {
        properties.value = properties.value.filter(p => p.id !== id)
        // Cascade delete rooms? For mockup, maybe just leave them or filter them out in UI
        rooms.value = rooms.value.filter(r => r.propertyId !== id)
    }

    // Rooms
    function addRoom(room: Omit<Room, 'id'>) {
        const id = Date.now().toString()
        rooms.value.push({ ...room, id })
    }

    function updateRoom(id: string, updates: Partial<Room>) {
        const index = rooms.value.findIndex(r => r.id === id)
        if (index !== -1) {
            rooms.value[index] = { ...rooms.value[index], ...updates }
        }
    }

    function deleteRoom(id: string) {
        rooms.value = rooms.value.filter(r => r.id !== id)
    }

    // Billing
    function generateBill(data: {
        roomId: string,
        period: string,
        meterStart: number,
        meterEnd: number,
        costPerKwh: number,
        additionalCost: number // water, wifi, etc.
    }) {
        const room = rooms.value.find(r => r.id === data.roomId)
        if (!room) throw new Error('Room not found')

        const usage = data.meterEnd - data.meterStart
        const usageCost = usage * data.costPerKwh
        // Total = Room Price + Electricity Usage + Additional
        const totalAmount = room.price + usageCost + data.additionalCost

        const newBill: Bill = {
            id: Date.now().toString(),
            roomId: data.roomId,
            period: data.period,
            meterStart: data.meterStart,
            meterEnd: data.meterEnd,
            costPerKwh: data.costPerKwh,
            usageCost,
            additionalCost: data.additionalCost,
            totalAmount,
            isPaid: false,
            generatedAt: new Date().toISOString()
        }

        bills.value.unshift(newBill) // Add to top
        return newBill
    }

    function markBillAsPaid(id: string) {
        const bill = bills.value.find(b => b.id === id)
        if (bill) {
            bill.isPaid = true
        }
    }

    function deleteBill(id: string) {
        bills.value = bills.value.filter(b => b.id !== id)
    }

    // Tenants
    function addTenant(tenant: Omit<Tenant, 'id'>) {
        const id = Date.now().toString()
        tenants.value.push({ ...tenant, id })
    }

    function updateTenant(id: string, updates: Partial<Tenant>) {
        const index = tenants.value.findIndex(t => t.id === id)
        if (index !== -1) {
            tenants.value[index] = { ...tenants.value[index], ...updates }
        }
    }

    function deleteTenant(id: string) {
        tenants.value = tenants.value.filter(t => t.id !== id)
    }

    // --- Getters ---
    const getPropertyById = computed(() => (id: string) => properties.value.find(p => p.id === id))
    const getRoomsByPropertyId = computed(() => (propertyId: string) => rooms.value.filter(r => r.propertyId === propertyId))
    const getBillsByRoomId = computed(() => (roomId: string) => bills.value.filter(b => b.roomId === roomId))


    return {
        // State
        properties,
        rooms,
        bills,
        tenants,
        settings,
        // Actions
        updateSettings,
        addProperty,
        updateProperty,
        deleteProperty,
        addRoom,
        updateRoom,
        deleteRoom,
        generateBill,
        markBillAsPaid,
        deleteBill,
        addTenant,
        updateTenant,
        deleteTenant,
        // Getters
        getPropertyById,
        getRoomsByPropertyId,
        getBillsByRoomId
    }
}, {
    // persist: true - Handled manually
})
