<template>
  <div ref="containerRef" class="w-full h-full min-h-[300px] bg-cream-100 rounded-xl overflow-hidden">
    <div v-if="loading" class="w-full h-full flex items-center justify-center">
      <UiLoadingSpinner text="Loading 3D model..." />
    </div>
    <div v-if="error" class="w-full h-full flex flex-col items-center justify-center text-stone-500">
      <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
      <p class="text-sm">{{ error }}</p>
    </div>
    <canvas ref="canvasRef" :class="{ 'opacity-0': loading || error }" class="w-full h-full transition-opacity duration-300" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelUrl: string
  autoRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRotate: true,
  enableZoom: true,
  enablePan: false,
})

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Three.js variables
let scene: any = null
let camera: any = null
let renderer: any = null
let controls: any = null
let animationId: number | null = null

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return

  try {
    // Dynamic import for client-side only
    const THREE = await import('three')
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

    const container = containerRef.value
    const canvas = canvasRef.value
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xF5F3EE) // cream-100

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1, 3)

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    // Ground plane (for shadows)
    const groundGeometry = new THREE.CircleGeometry(2, 64)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.1 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = props.autoRotate
    controls.autoRotateSpeed = 1
    controls.enableZoom = props.enableZoom
    controls.enablePan = props.enablePan
    controls.minDistance = 1
    controls.maxDistance = 10
    controls.maxPolarAngle = Math.PI / 2

    // Load model
    const loader = new GLTFLoader()
    
    loader.load(
      props.modelUrl,
      (gltf: any) => {
        const model = gltf.scene
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1.5 / maxDim
        model.scale.multiplyScalar(scale)
        
        model.position.sub(center.multiplyScalar(scale))
        model.position.y = 0
        
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        scene.add(model)
        loading.value = false
      },
      (progress: any) => {
        // Loading progress
        const percent = (progress.loaded / progress.total) * 100
        console.log(`Loading 3D model: ${percent.toFixed(0)}%`)
      },
      (err: any) => {
        console.error('Error loading 3D model:', err)
        error.value = 'Failed to load 3D model'
        loading.value = false
      }
    )

    // Animation loop
    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !camera || !renderer) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    })
    resizeObserver.observe(container)

    // Cleanup on unmount
    onUnmounted(() => {
      resizeObserver.disconnect()
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (renderer) {
        renderer.dispose()
      }
      if (controls) {
        controls.dispose()
      }
    })

  } catch (err) {
    console.error('Three.js initialization error:', err)
    error.value = 'Failed to initialize 3D viewer'
    loading.value = false
  }
})
</script>
