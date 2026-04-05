<script setup lang="ts">
import type { ToastType } from '~/stores/toast'
import { useToastStore } from '~/stores/toast'

const toastStore = useToastStore()

const typeConfig: Record<ToastType, {
  bgClass: string
  borderClass: string
  iconBgClass: string
  iconColorClass: string
  progressClass: string
  titleColorClass: string
  descColorClass: string
}> = {
  success: {
    bgClass: 'bg-white',
    borderClass: 'border-green-200',
    iconBgClass: 'bg-green-50',
    iconColorClass: 'text-green-500',
    progressClass: 'bg-green-400',
    titleColorClass: 'text-green-800',
    descColorClass: 'text-green-600',
  },
  error: {
    bgClass: 'bg-white',
    borderClass: 'border-red-200',
    iconBgClass: 'bg-red-50',
    iconColorClass: 'text-red-500',
    progressClass: 'bg-red-400',
    titleColorClass: 'text-red-800',
    descColorClass: 'text-red-600',
  },
  warning: {
    bgClass: 'bg-white',
    borderClass: 'border-amber-200',
    iconBgClass: 'bg-amber-50',
    iconColorClass: 'text-amber-500',
    progressClass: 'bg-amber-400',
    titleColorClass: 'text-amber-800',
    descColorClass: 'text-amber-600',
  },
  info: {
    bgClass: 'bg-white',
    borderClass: 'border-blue-200',
    iconBgClass: 'bg-blue-50',
    iconColorClass: 'text-blue-500',
    progressClass: 'bg-blue-400',
    titleColorClass: 'text-blue-800',
    descColorClass: 'text-blue-600',
  },
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none max-sm:left-4 max-sm:right-4"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="[
            typeConfig[toast.type].bgClass,
            typeConfig[toast.type].borderClass,
          ]"
          class="pointer-events-auto w-full sm:w-96 rounded-xl border shadow-soft-lg overflow-hidden"
          role="alert"
        >
          <div class="p-4 flex gap-3">
            <!-- Icon -->
            <div
              :class="[
                typeConfig[toast.type].iconBgClass,
                typeConfig[toast.type].iconColorClass,
              ]"
              class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <!-- Success -->
              <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <!-- Error -->
              <svg v-else-if="toast.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Warning -->
              <svg v-else-if="toast.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <!-- Info -->
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p
                :class="typeConfig[toast.type].titleColorClass"
                class="text-sm font-semibold leading-tight"
              >
                {{ toast.title }}
              </p>
              <p
                v-if="toast.description"
                :class="typeConfig[toast.type].descColorClass"
                class="text-xs mt-1 leading-relaxed opacity-90"
              >
                {{ toast.description }}
              </p>
              <!-- Action button -->
              <button
                v-if="toast.action"
                :class="typeConfig[toast.type].iconColorClass"
                class="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                @click="toast.action.callback(); toastStore.removeToast(toast.id)"
              >
                {{ toast.action.label }}
              </button>
            </div>

            <!-- Dismiss button -->
            <button
              class="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Dismiss notification"
              @click="toastStore.removeToast(toast.id)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Progress bar -->
          <div
            v-if="toast.duration > 0"
            class="h-0.5 w-full bg-stone-100"
          >
            <div
              :class="typeConfig[toast.type].progressClass"
              class="h-full toast-progress-bar"
              :style="{ animationDuration: `${toast.duration}ms` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Toast entrance/exit transitions */
.toast-enter-active {
  animation: toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
}

.toast-leave-active {
  animation: toastSlideOut 0.25s cubic-bezier(0.06, 0.71, 0.55, 1) forwards;
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
}

/* Progress bar countdown */
.toast-progress-bar {
  animation: toastProgressCountdown linear forwards;
  transform-origin: left;
}

@keyframes toastProgressCountdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
