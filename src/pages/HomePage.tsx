import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'

// Fallback proje listesi — projects.json yüklenemezse kullanılır
const FALLBACK_PROJECTS = ['1108-1', 'demo']

// WebGL Arka Plan Bileşeni
function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const materialRef = useRef<THREE.ShaderMaterial>()

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: true, 
      powerPreference: 'high-performance',
      stencil: false,
      depth: false
    })
    
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Shader Code
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      
      varying vec2 vUv;

      mat2 rot(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        vec2 fragCoord = vUv * uResolution;
        vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;
        
        vec3 origin = vec3(0.0, 0.0, -10.0);
        vec3 direction = normalize(vec3(uv, 1.0));
        
        mat2 rotX = rot(uMouse.x * 0.5);

        vec3 color = vec3(0.0);
        float depth = 0.1;

        for(float i = 0.0; i < 64.0; i++) {
          vec3 pos = origin + direction * depth;
          pos.xz *= rotX;

          vec3 deformed = pos;
          deformed.y *= uPillarHeight;
          
          float wave = cos(deformed.y * 2.0 + uTime) * 0.2;
          deformed.x += wave;

          float d = length(cos(deformed.xz)) - 0.2;
          
          float bound = length(pos.xz) - uPillarWidth;
          d = max(d, -bound); 
          
          float glow = 0.02 / (abs(d) + 0.01);
          
          float yGradient = smoothstep(2.0, -2.0, pos.y);
          vec3 col = mix(uBottomColor, uTopColor, yGradient);
          
          color += col * glow * uGlowAmount;
          
          depth += max(abs(d) * 0.5, 0.02);
          if(depth > 20.0) break;
        }
        
        float vig = 1.0 - length(uv) * 0.3;
        color *= vig;
        
        gl_FragColor = vec4(color * uIntensity, 1.0);
      }
    `

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTopColor: { value: new THREE.Color('#D0BB95') }, // Gold/Cream
        uBottomColor: { value: new THREE.Color('#3d3428') }, // Dark gold
        uIntensity: { value: 1.0 },
        uGlowAmount: { value: 0.05 },
        uPillarWidth: { value: 3.5 },
        uPillarHeight: { value: 0.6 }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    })

    materialRef.current = material

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    // Animation
    let time = 0
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      time += 0.005
      material.uniforms.uTime.value = time
      renderer.render(scene, camera)
    }

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      material.uniforms.uResolution.value.set(w, h)
    }

    // Mouse handler
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      material.uniforms.uMouse.value.set(x, y)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      scene.remove(mesh)
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#1d1a15' }}
    />
  )
}

// Feature Card Bileşeni
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  footer?: React.ReactNode
}

function FeatureCard({ icon, title, description, footer }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#3d3428] bg-[#1d1a15]/60 backdrop-blur-xl p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      style={{ boxShadow: 'rgba(50, 50, 93, 0.15) 0px 30px 60px -12px inset, rgba(0, 0, 0, 0.2) 0px 18px 36px -18px inset' }}>
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      {footer && (
        <div className="mt-4 pt-4 border-t border-[#3d3428]/50">
          {footer}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectId, setNewProjectId] = useState('')
  const [availableProjects, setAvailableProjects] = useState<string[]>(FALLBACK_PROJECTS)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Proje listesini dinamik yükle
  useEffect(() => {
    fetch('/data/projects.json')
      .then(r => r.ok ? r.json() : FALLBACK_PROJECTS)
      .then((list: string[]) => setAvailableProjects(list))
      .catch(() => setAvailableProjects(FALLBACK_PROJECTS))
  }, [])

  // Arama sonuçlarını filtrele
  const filteredProjects = availableProjects.filter(project =>
    project.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Dışarı tıklayınca dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
        // Eğer arama boşsa barı da kapat
        if (!searchQuery) {
          setIsSearchOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchQuery])

  // Arama açıldığında input'a focus
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Projeye git (viewer)
  const goToProject = useCallback((projectId: string) => {
    navigate(`/${projectId}`)
    setShowResults(false)
    setSearchQuery('')
    setIsSearchOpen(false)
  }, [navigate])

  // Yeni proje oluştur (editor)
  const createNewProject = useCallback(() => {
    if (newProjectId.trim()) {
      navigate(`/${newProjectId.trim()}/editor`)
      setShowNewProjectModal(false)
      setNewProjectId('')
    }
  }, [newProjectId, navigate])

  return (
    <div className="min-h-screen bg-editor-bg relative overflow-x-hidden">
      {/* WebGL Arka Plan */}
      <WebGLBackground />

      {/* Ana İçerik */}
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full">
          
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
              Ganged Reality
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Web tabanlı 3D içerik yönetim ve görselleştirme platformu
            </p>
          </div>

          {/* Arama ve Yeni Proje */}
          <div className="flex items-center justify-center gap-3 mb-12">
            {/* Arama Alanı - Animasyonlu */}
            <div ref={searchRef} className="relative">
              <div 
                className={`flex items-center bg-[#1d1a15]/80 backdrop-blur-xl border border-[#3d3428] rounded-xl overflow-hidden transition-all duration-300 ease-out ${
                  isSearchOpen 
                    ? 'w-80 border-primary/50' 
                    : 'w-12 cursor-pointer hover:border-primary/30 hover:bg-[#1d1a15]'
                }`}
                onClick={() => !isSearchOpen && setIsSearchOpen(true)}
              >
                <div className={`text-gray-500 transition-all duration-300 ${isSearchOpen ? 'pl-4' : 'p-3 hover:text-primary'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Proje ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowResults(true)
                  }}
                  onFocus={() => setShowResults(true)}
                  className={`bg-transparent text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                    isSearchOpen ? 'w-full px-3 py-3 opacity-100' : 'w-0 p-0 opacity-0'
                  }`}
                />
                {/* Kapatma butonu */}
                {isSearchOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsSearchOpen(false)
                      setSearchQuery('')
                      setShowResults(false)
                    }}
                    className="pr-3 text-gray-500 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Arama Sonuçları Dropdown */}
              {showResults && searchQuery && isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1d1a15]/95 backdrop-blur-xl border border-[#3d3428] rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <button
                        key={project}
                        onClick={() => goToProject(project)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-primary/10 transition-colors flex items-center gap-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{project}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      Sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Yeni Proje Butonu */}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-primary hover:bg-primary/80 text-editor-bg p-3 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
              title="Yeni Proje"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Özellikler Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Feature 1: 3D Gezinti */}
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              title="360° 3D Gezinti"
              description="Mekanları gerçekçi 3D ortamda özgürce keşfedin. Mouse veya dokunmatik kontroller ile istediğiniz açıdan inceleyin."
              footer={
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Mouse
                  </span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Mobil
                  </span>
                </div>
              }
            />

            {/* Feature 2: Ürün Varyasyonları */}
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              }
              title="Renk & Malzeme Seçimi"
              description="Ürünlerin farklı renk ve malzeme seçeneklerini anında görün. Tercihlerinizi gerçek zamanlı olarak deneyimleyin."
              footer={
                <div className="flex gap-2">
                  {['#D0BB95', '#8B7355', '#4A4A4A', '#2C3E50'].map((color, i) => (
                    <div key={i} className="h-4 w-4 rounded-full ring-1 ring-white/20 cursor-pointer hover:scale-110 transition-transform" style={{ background: color }} />
                  ))}
                </div>
              }
            />

            {/* Feature 3: Etkileşim Noktaları */}
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Detaylı Bilgi Noktaları"
              description="Mekan içindeki özel noktalara tıklayarak ürün detaylarını, teknik bilgileri ve videoları keşfedin."
              footer={
                <div className="grid grid-cols-3 gap-2">
                  {['Bilgi', 'Video', 'Link'].map((type, i) => (
                    <div key={i} className="text-center">
                      <div className={`h-1 w-full bg-primary rounded-full mb-1`} style={{ opacity: 1 - i * 0.3 }} />
                      <span className="text-[10px] text-gray-500 font-semibold">{type}</span>
                    </div>
                  ))}
                </div>
              }
            />

            {/* Feature 4: Kolay Kullanım */}
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Her Cihazda Çalışır"
              description="Kurulum gerektirmez. Tarayıcınızdan anında erişin. Masaüstü, tablet ve mobil cihazlarla tam uyumlu."
              footer={
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kurulum yok
                  </span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Hızlı yükleme
                  </span>
                </div>
              }
            />

          </div>

        </div>
      </main>

      {/* Yeni Proje Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1d1a15] border border-[#3d3428] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{ boxShadow: 'rgba(208, 187, 149, 0.1) 0px 0px 50px' }}>
            <h2 className="text-xl font-semibold text-white mb-2">
              Yeni Proje Oluştur
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Proje URL'sini girin. Mevcut değilse yeni bir editör açılacak.
            </p>
            <input
              type="text"
              placeholder="Proje ID (örn: 1234)"
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createNewProject()}
              autoFocus
              className="w-full bg-[#152228] border border-[#3d3428] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewProjectModal(false)
                  setNewProjectId('')
                }}
                className="flex-1 bg-[#152228] hover:bg-[#1e2e36] text-white py-3 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={createNewProject}
                disabled={!newProjectId.trim()}
                className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-editor-bg py-3 rounded-xl transition-colors font-medium"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
