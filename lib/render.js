import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

let animations,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allPrizes,
  scene,
  camera,
  cardCanvas,
  cardImgUrl,
  renderer,
  orbitControls,
  mixer,
  particles,
  soundAnimation,
  clock = new THREE.Clock()

const render = () => {
  orbitControls.update()

  if (mixer) mixer.update(clock.getDelta())

  renderer.render(scene, camera)

  requestAnimationFrame(render)
}

export const unmute = () => {
  document.getElementById('animation').muted = false
  document.getElementById('particles-coins').muted = false
  document.getElementById('particles-fireworks').muted = false
}

export const mute = () => {
  document.getElementById('animation').muted = true
  document.getElementById('particles-coins').muted = true
  document.getElementById('particles-fireworks').muted = true
}

export const onClick = () => {
  console.log('render:onClick', particles)
  if (particles) {
    particles.muted = false
    particles.currentTime = 0
    particles.play()
  }
}

const onResize = () => {
  console.log('render:onResize')

  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

const lumaKeyVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const lumaKeyFragmentShader = `
uniform sampler2D tex;
uniform float threshold;
varying vec2 vUv;
void main(void) {
  vec2 texCoord = vUv;
  vec4 rgba = texture2D(tex, texCoord);
  float luma = rgba.r * 0.299 + rgba.g * 0.587 + rgba.b * 0.114;
  rgba.a = step(threshold, luma);
  gl_FragColor = rgba;
}
`

class LumaKeyMaterial extends THREE.ShaderMaterial {
  constructor(tex, threshold) {
    super()
    this.setValues({
      uniforms: {
        tex: {
          value: tex,
        },
        threshold: {
          value: threshold,
        },
      },
      vertexShader: lumaKeyVertexShader,
      fragmentShader: lumaKeyFragmentShader,
      transparent: true,
    })
    this.needsUpdate = true
  }
}

const prepareCardFace = async (document, window, prize) => {
  // Create a canvas element
  if (!cardCanvas) {
    cardCanvas = document.createElement('canvas')
    cardCanvas.width = 600
    cardCanvas.height = 900
  }

  // load assets
  const stencilImage = new Image(600, 900)
  stencilImage.src = prize.stencilUrl

  const brandImage = new Image(...prize.itemResolution)
  brandImage.crossOrigin = 'anonymous'
  brandImage.src = prize.itemUrl

  await Promise.all([stencilImage.decode(), brandImage.decode()])
  console.log('prepareCardFace:load', stencilImage, brandImage)

  // draw
  const ctx = cardCanvas.getContext('2d')
  ctx.fillStyle = '#2F318D'
  ctx.fillRect(0, 0, 600, 900)
  ctx.drawImage(brandImage, 80, 230, 440, 440)
  ctx.drawImage(stencilImage, 0, 0)

  cardImgUrl = cardCanvas.toDataURL('image/png')
  console.log('prepareCardFace:save', cardImgUrl)
}

const prepareScene = (prize) => {
  // lookup materials
  var frontMat, backMat
  scene.traverse((n) => {
    if (n.name === prize.frontMaterialId) {
      frontMat = n.material
    }
    if (n.name === prize.backMaterialId) {
      backMat = n.material
    }
  })

  // update materials
  scene.traverse((n) => {
    if (n.name === 'particle_video_screen') {
      particles = document.getElementById(prize.particleId)
      // NOTE: display last frame to hide first frame particles
      if (isFinite(particles.duration))
        particles.currentTime = particles.duration

      const tex = new THREE.VideoTexture(particles)
      tex.flipY = false

      const mat = new LumaKeyMaterial(tex, 0.15)
      console.log('render:prepareScene:particles', tex, mat, n.material)

      n.material.dispose()
      n.material = mat
    }
    if (n.name === 'card_front_side') {
      const tex = new THREE.CanvasTexture(cardCanvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = false
      tex.generateMipmaps = true
      tex.needsUpdate = true

      console.log('render:prepareScene:frontSide', tex)

      frontMat.map.dispose()
      frontMat.map = tex
      n.material = frontMat
    }
    if (n.name === 'card_back_side') {
      n.material = backMat
    }
  })
}

const playAnimation = (prize, prizeCallback, isLast) => {
  // reset mixer
  const loader = document.getElementById('animation-component-loader')
  if (loader) {
    loader.remove()
  }
  mixer = new THREE.AnimationMixer(scene)

  soundAnimation.currentTime = 0
  soundAnimation.play()

  animations.forEach((a) => {
    console.log('render:playAnimation:animations:play', a)

    mixer.clipAction(a).setLoop(THREE.LoopOnce).play()
  })

  setTimeout(() => {
    if (particles) {
      console.log('render:playAnimation:particles:play', particles)

      particles.currentTime = 0
      particles.play()
      let lastSoundtrackTime = soundAnimation.currentTime
      setTimeout(() => {
        console.log('render:playAnimation:sound:resume', soundAnimation.paused)

        soundAnimation.currentTime = lastSoundtrackTime + 4.4
        soundAnimation.play()

        // force reload on particles
        particles.load()
      }, 4_400)
    }
  }, 10_000)

  // notify UI to display prize
  setTimeout(() => {
    prize.cardImgUrl = cardImgUrl
    prizeCallback(prize, isLast)
  }, 17_000)
}

export const init = (document, window, prizes, prizeCallback) => {
  console.log('render:init', !!document, !!window)
  if (!document) return
  if (!window) return

  soundAnimation = document.getElementById('animation')

  allPrizes = prizes

  /* scene
    -------------------------------------------------------------*/
  scene = new THREE.Scene()
  //scene.fog = new THREE.Fog(0x000d20, 0, 1000 * 3);

  /* camera
    -------------------------------------------------------------*/
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  )
  camera.position.set(0, -40, 170)
  camera.lookAt(scene.position)

  /* renderer
    -------------------------------------------------------------*/
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(new THREE.Color(0x000000), 0)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.setClearAlpha(0)

  /* OrbitControls
    -------------------------------------------------------------*/
  orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.autoRotate = false
  orbitControls.enableDamping = true
  orbitControls.dampingFactor = 0.2

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rgbeLoader = new RGBELoader().load(
    'environments/royal_esplanade_1k_var.hdr',
    (texture) => {
      console.log('render:init:load:environment', texture)
      texture.mapping = THREE.EquirectangularReflectionMapping
      // scene.background = texture;
      scene.environment = texture

      const gltfLoader = new GLTFLoader()

      // // Optional: Provide a DRACOLoader instance to decode compressed mesh data
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/libs/draco/')
      gltfLoader.setDRACOLoader(dracoLoader)

      // Load a glTF resource
      gltfLoader.load(
        // resource URL
        'models/chest_shading_prev.gltf',
        // called when the resource is loaded
        (gltf) => {
          console.log('render:init:load:gltf', gltf)
          gltf.scene.traverse((n) => {
            if (n.isLight) {
              console.log('render:init:load:light', n)
              // n.intensity = n.intensity / 3;
              // n.decay = 0;
            }
            if (n.isCamera) {
              console.log('render:init:load:camera', n)
              camera = n
              onResize()
            }
          })

          scene.add(gltf.scene)

          gltf.animations // Array<THREE.AnimationClip>
          gltf.scene // THREE.Group
          gltf.scenes // Array<THREE.Group>
          gltf.cameras // Array<THREE.Camera>
          gltf.asset // Object

          console.log('render:init:load:animations', gltf.animations)

          mixer = new THREE.AnimationMixer(scene)
          animations = gltf.animations
          prizes.forEach((p, i) => {
            setTimeout(() => {
              prepareCardFace(document, window, p).then(() => prepareScene(p))
              playAnimation(p, prizeCallback, i == prizes.length - 1)
            }, i * 27_000)
          })
        },
        // // called while loading is progressing
        // function (xhr) {
        //   console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        // },
        // // called when loading has errors
        // function (error) {
        //   console.log("An error happened");
        // }
      )
    },
  )

  /* resize
    -------------------------------------------------------------*/
  window.addEventListener('resize', onResize)

  /* rendering start
    -------------------------------------------------------------*/
  document.getElementById('render-output').appendChild(renderer.domElement)
  requestAnimationFrame(render)
}
