import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const planetSpecs = [
  { name: 'Mercury', orbit: 1.32, size: 0.105, color: '#aca79d', speed: 0.72, tilt: 0.04, shade: '#b6b0a4' },
  { name: 'Venus', orbit: 2.0, size: 0.16, color: '#d9a76e', speed: 0.49, tilt: -0.055, shade: '#f0d29a' },
  { name: 'Earth', orbit: 2.78, size: 0.19, color: '#528ece', speed: 0.37, tilt: 0.08, shade: '#77c5a4' },
  { name: 'Mars', orbit: 3.52, size: 0.145, color: '#cf7150', speed: 0.28, tilt: -0.035, shade: '#e49a70' },
  { name: 'Jupiter', orbit: 4.25, size: 0.33, color: '#d0aa80', speed: 0.17, tilt: 0.025, shade: '#f0d9b9' },
  { name: 'Saturn', orbit: 5.0, size: 0.27, color: '#cdb477', speed: 0.12, tilt: -0.065, shade: '#efdfa5' },
]

function makeBandTexture(baseColor, bands) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  bands.forEach(([stop, color]) => gradient.addColorStop(stop, color))
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.globalAlpha = 0.18
  for (let bandIndex = 0; bandIndex < 32; bandIndex += 1) {
    const y = bandIndex * 9 + Math.random() * 5
    context.fillStyle = bandIndex % 2 === 0 ? '#fff0d0' : baseColor
    context.fillRect(0, y, canvas.width, 1 + Math.random() * 3)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeEarthTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  const ocean = context.createLinearGradient(0, 0, 512, 256)
  ocean.addColorStop(0, '#22639b')
  ocean.addColorStop(0.5, '#3988bd')
  ocean.addColorStop(1, '#173e79')
  context.fillStyle = ocean
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#65a77c'
  const continents = [
    [[58, 66], [84, 45], [119, 51], [131, 72], [117, 91], [128, 116], [104, 132], [95, 164], [75, 139], [68, 111], [49, 94]],
    [[139, 143], [167, 128], [189, 140], [193, 166], [179, 190], [169, 220], [154, 202], [149, 178]],
    [[244, 69], [269, 51], [299, 58], [313, 76], [342, 74], [371, 90], [364, 111], [340, 120], [325, 141], [298, 128], [280, 146], [258, 130], [245, 106], [228, 96]],
    [[320, 145], [348, 137], [370, 151], [376, 177], [358, 204], [335, 197], [323, 177]],
    [[414, 102], [433, 94], [444, 109], [437, 123], [420, 120]],
  ]
  continents.forEach(points => {
    context.beginPath()
    points.forEach(([x, y], index) => index === 0 ? context.moveTo(x, y) : context.lineTo(x, y))
    context.closePath()
    context.fill()
  })
  context.globalAlpha = 0.32
  context.strokeStyle = '#caeee2'
  context.lineWidth = 2
  for (let latitude = 28; latitude < 256; latitude += 42) {
    context.beginPath()
    context.ellipse(256, latitude, 256, 12, 0, 0, Math.PI * 2)
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const glow = context.createRadialGradient(64, 64, 4, 64, 64, 64)
  glow.addColorStop(0, 'rgba(255,244,193,0.9)')
  glow.addColorStop(0.2, 'rgba(255,191,106,0.5)')
  glow.addColorStop(0.55, 'rgba(251,132,76,0.15)')
  glow.addColorStop(1, 'rgba(251,132,76,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createStars(scene) {
  const starCount = 340
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  const starColor = new THREE.Color()

  for (let starIndex = 0; starIndex < starCount; starIndex += 1) {
    positions[starIndex * 3] = (Math.random() - 0.5) * 16
    positions[starIndex * 3 + 1] = (Math.random() - 0.5) * 9
    positions[starIndex * 3 + 2] = -4 - Math.random() * 5
    starColor.setHSL(0.12 + Math.random() * 0.18, 0.24, 0.72 + Math.random() * 0.22)
    colors[starIndex * 3] = starColor.r
    colors[starIndex * 3 + 1] = starColor.g
    colors[starIndex * 3 + 2] = starColor.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.82, sizeAttenuation: true, depthWrite: false })
  scene.add(new THREE.Points(geometry, material))
}

function createSun(scene, glowTexture) {
  const sun = new THREE.Group()
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.63, 48, 32),
    new THREE.MeshStandardMaterial({ color: '#ffb34e', emissive: '#fb6d32', emissiveIntensity: 1.2, roughness: 0.5, metalness: 0 }),
  )
  sun.add(sphere)

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: '#ffc878', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.scale.set(5.7, 5.7, 1)
  sun.add(glow)

  const corona = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.012, 6, 120),
    new THREE.MeshBasicMaterial({ color: '#f8bc6b', transparent: true, opacity: 0.55 }),
  )
  corona.rotation.x = Math.PI / 2.4
  sun.add(corona)
  scene.add(sun)
  return sun
}

function createPlanet(scene, spec, index) {
  const orbitalPlane = new THREE.Group()
  orbitalPlane.rotation.x = spec.tilt
  orbitalPlane.rotation.z = Math.sin(index * 1.7) * 0.025
  scene.add(orbitalPlane)

  const orbitPath = new THREE.Mesh(
    new THREE.TorusGeometry(spec.orbit, 0.006, 5, 180),
    new THREE.MeshBasicMaterial({ color: spec.shade, transparent: true, opacity: 0.24, depthWrite: false }),
  )
  orbitPath.rotation.x = Math.PI / 2
  orbitalPlane.add(orbitPath)

  const revolution = new THREE.Group()
  orbitalPlane.add(revolution)
  const sphereGeometry = new THREE.SphereGeometry(spec.size, 32, 24)
  let texture = null

  if (spec.name === 'Earth') texture = makeEarthTexture()
  if (spec.name === 'Jupiter') texture = makeBandTexture('#a97859', [[0, '#e5ceb0'], [0.2, '#bd8d69'], [0.34, '#f0dec0'], [0.5, '#a46e51'], [0.65, '#e6c8a4'], [0.82, '#b17d5d'], [1, '#ead5b6']])
  if (spec.name === 'Saturn') texture = makeBandTexture('#a98956', [[0, '#eedda8'], [0.24, '#c7a36d'], [0.4, '#f0dfa9'], [0.62, '#b99560'], [0.78, '#e8d39d'], [1, '#a88654']])

  const material = new THREE.MeshStandardMaterial({
    color: texture ? '#ffffff' : spec.color,
    map: texture,
    roughness: 0.82,
    metalness: 0.01,
  })
  const planet = new THREE.Mesh(sphereGeometry, material)
  planet.position.x = spec.orbit
  revolution.add(planet)

  if (spec.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(spec.size * 1.38, spec.size * 2.15, 72),
      new THREE.MeshStandardMaterial({ color: '#d7bf8e', side: THREE.DoubleSide, roughness: 0.88, metalness: 0.04, transparent: true, opacity: 0.84 }),
    )
    ring.rotation.x = -Math.PI / 2.35
    ring.rotation.y = 0.16
    planet.add(ring)
    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(spec.size * 2.2, spec.size * 2.34, 72),
      new THREE.MeshBasicMaterial({ color: '#efdbab', side: THREE.DoubleSide, transparent: true, opacity: 0.42 }),
    )
    outerRing.rotation.copy(ring.rotation)
    planet.add(outerRing)
  }

  revolution.rotation.y = Math.random() * Math.PI * 2
  return { orbitalPlane, revolution, planet, speed: spec.speed }
}

function SolarSystemScene() {
  const containerRef = useRef(null)
  const pointerRef = useRef({ x: 0, y: 0 })

  const updatePointer = event => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerRef.current.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    pointerRef.current.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
  }

  const resetPointer = () => { pointerRef.current = { x: 0, y: 0 } }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    let renderer
    let animationFrame = 0
    let resizeObserver
    let previousFrameTime = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const planetSystems = []
    let scene

    try {
      scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
      camera.position.set(0, 6.7, 15.2)
      camera.lookAt(0, 0.05, 0)
      const systemRoot = new THREE.Group()
      scene.add(systemRoot)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.08
      renderer.setClearColor(0x000000, 0)
      renderer.domElement.setAttribute('aria-hidden', 'true')
      container.appendChild(renderer.domElement)

      scene.add(new THREE.HemisphereLight('#d9edff', '#4d5267', 2.25))
      const sunlight = new THREE.PointLight('#ffe2b2', 70, 28, 2)
      sunlight.position.set(0, 0, 0)
      scene.add(sunlight)

      const glowTexture = makeGlowTexture()
      createStars(systemRoot)
      const sun = createSun(systemRoot, glowTexture)
      planetSpecs.forEach((spec, index) => planetSystems.push(createPlanet(systemRoot, spec, index)))

      const resize = () => {
        const width = Math.max(container.clientWidth, 1)
        const height = Math.max(container.clientHeight, 1)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
      }

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      resize()

      const render = frameTime => {
        animationFrame = window.requestAnimationFrame(render)
        const delta = Math.min((frameTime - previousFrameTime) / 1000, 0.04)
        previousFrameTime = frameTime
        if (!reducedMotion) {
          planetSystems.forEach(system => {
            system.revolution.rotation.y += system.speed * delta
            system.planet.rotation.y += delta * (system.speed + 0.45)
          })
          sun.rotation.y += delta * 0.08
          systemRoot.rotation.y += (pointerRef.current.x * 0.11 - systemRoot.rotation.y) * Math.min(delta * 2.6, 1)
          systemRoot.rotation.x += (pointerRef.current.y * -0.075 - systemRoot.rotation.x) * Math.min(delta * 2.6, 1)
        }
        renderer.render(scene, camera)
      }

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render)
      container.dataset.ready = 'true'
    } catch {
      container.dataset.fallback = 'true'
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      if (renderer) {
        renderer.renderLists.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
      scene?.traverse(object => {
        object.geometry?.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.filter(Boolean).forEach(material => {
          material.map?.dispose()
          material.dispose()
        })
      })
    }
  }, [])

  return <div className="solar-scene" ref={containerRef} role="img" aria-label="A dimensional solar system with a glowing sun, six textured planets, orbit rings, and stars" onPointerMove={updatePointer} onPointerLeave={resetPointer} />
}

export default SolarSystemScene