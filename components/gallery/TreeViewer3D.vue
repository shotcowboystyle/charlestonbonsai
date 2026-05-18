<script setup lang="ts">
interface Props {
  modelUrl: string
  autoRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  // When false, the viewer is interactive from first paint — appropriate
  // when entry into 3D mode is itself a deliberate user action (e.g. a
  // lens-toggle on a specimen page). When true (default), a small
  // "click to interact" guard prevents accidental scroll capture.
  requireActivation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRotate: true,
  enableZoom: true,
  enablePan: false,
  requireActivation: true,
})

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activated = ref(!props.requireActivation)

let scene: any = null
let camera: any = null
let renderer: any = null
let animationId: number | null = null
const controls = ref<any>(null)

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value)
    return

  try {
    const THREE = await import('three')
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

    const container = containerRef.value!
    const canvas = canvasRef.value
    const width = container.clientWidth
    const height = container.clientHeight

    scene = new THREE.Scene()
    // Transparent — the surrounding plate surface shows through, so the
    // viewer's backdrop matches the page in both light and dark themes.
    scene.background = null

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1, 3)

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xFFFFFF, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    const groundGeometry = new THREE.CircleGeometry(2, 64)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.1 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    controls.value = new OrbitControls(camera, renderer.domElement)
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05
    controls.value.autoRotate = props.autoRotate
    controls.value.autoRotateSpeed = 1
    controls.value.enableZoom = !props.requireActivation
    controls.value.enablePan = props.enablePan
    controls.value.minDistance = 1
    controls.value.maxDistance = 10
    controls.value.maxPolarAngle = Math.PI / 2

    const loader = new GLTFLoader()

    loader.load(
      props.modelUrl,
      (gltf: any) => {
        const model = gltf.scene
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
      undefined,
      (err: any) => {
        console.error('Error loading 3D model:', err)
        error.value = 'The model couldn’t load.'
        loading.value = false
      },
    )

    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.value.update()
      renderer.render(scene, camera)
    }
    animate()

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !camera || !renderer)
        return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    })
    resizeObserver.observe(container as unknown as Element)

    onUnmounted(() => {
      resizeObserver.disconnect()
      if (animationId)
        cancelAnimationFrame(animationId)
      if (renderer)
        renderer.dispose()
      if (controls.value)
        controls.value.dispose()
    })
  }
  catch (err) {
    console.error('Three.js initialisation error:', err)
    error.value = 'The 3D viewer couldn’t initialise.'
    loading.value = false
  }
})

function activate() {
  activated.value = true
  if (controls.value)
    controls.value.enableZoom = true
}
</script>

<template>
  <div ref="containerRef" class="viewer">
    <p v-if="loading" class="viewer__state">
      loading three-dimensional model…
    </p>
    <p v-else-if="error" class="viewer__state viewer__state--error">
      {{ error }}
    </p>
    <canvas
      ref="canvasRef"
      class="viewer__canvas"
      :class="{ 'viewer__canvas--quiet': loading || error }"
    />
    <button
      v-if="!activated && !loading && !error"
      type="button"
      class="viewer__activate"
      @click="activate"
    >
      tap to interact
    </button>
  </div>
</template>

<style scoped>
.viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 18rem;
  background: var(--surface-sunken);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.viewer__canvas {
  display: block;
  width: 100%;
  height: 100%;
  transition: opacity var(--duration-base) var(--ease-out-quart);
}

.viewer__canvas--quiet {
  opacity: 0;
}

.viewer__state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: var(--space-md);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-faint);
  text-align: center;
}

.viewer__state--error {
  color: var(--text-muted);
}

.viewer__activate {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in oklch, var(--surface) 60%, transparent);
  backdrop-filter: blur(1px);
  border: 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text);
  font-feature-settings: var(--feat-small-caps);
  transition: background-color var(--duration-base) var(--ease-out-quart);
}

.viewer__activate:hover {
  background: color-mix(in oklch, var(--surface) 40%, transparent);
}

.viewer__activate:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
