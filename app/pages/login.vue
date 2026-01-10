<script setup lang="ts">
definePageMeta({
  layout: false,
});

const router = useRouter();
const isLoading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const handleLogin = async () => {
  // if (!form.username || !form.password) return; // Allow empty for mock testing or show error

  isLoading.value = true;
  // Simulating process but allowing it to proceed
  await new Promise((resolve) => setTimeout(resolve, 500));
  isLoading.value = false;

  if (process.client) {
    localStorage.setItem('kos-man-auth', 'true')
  }
  await router.push("/properties");
};
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Image -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
      <img
        src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"
        alt="Kos Interior"
        class="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"
      />

      <div
        class="relative z-10 p-12 flex flex-col justify-end h-full text-white"
      >
        <h1 class="text-4xl font-bold mb-4">Manage Your Kos Effortlessly</h1>
        <p class="text-lg text-gray-300">
          The most comprehensive solution for boarding house management. Track
          payments, manage rooms, and monitor electricity usage in one place.
        </p>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div
      class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-950"
    >
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <div
            class="w-12 h-12 bg-primary-500 rounded-xl mx-auto flex items-center justify-center mb-4 text-white"
          >
            <UIcon name="i-heroicons-home-modern" class="w-7 h-7" />
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Please enter your details to sign in
          </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6 mt-8">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <UInput 
              v-model="form.username" 
              icon="i-heroicons-user" 
              placeholder="admin" 
              size="lg"
              class="w-full"
              autofocus
            />
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <UInput 
              v-model="form.password" 
              type="password" 
              icon="i-heroicons-lock-closed" 
              placeholder="••••••••" 
              size="lg"
              class="w-full"
            />
          </div>

          <div class="flex items-center justify-between">
            <UCheckbox label="Remember me" />
            <a
              href="#"
              class="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >Forgot password?</a
            >
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
            class="font-bold"
          >
            Sign in
          </UButton>
        </form>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?
          <a
            href="#"
            class="text-primary-500 hover:text-primary-600 font-medium"
            >Contact Support</a
          >
        </p>
      </div>
    </div>
  </div>
</template>
