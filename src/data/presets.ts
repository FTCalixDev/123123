import { StylePreset, CameraMotionPreset, ShowcaseItem } from '../types/video';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic',
    name: 'Cine Fotorrealista',
    icon: 'Clapperboard',
    description: 'Iluminación anamórfica 35mm, profundidad de campo sutil y gradación de color cinematográfica',
    promptModifier: 'cinematic 35mm film still, photorealistic, anamorphic lens, Arri Alexa 8K footage, shallow depth of field, color graded'
  },
  {
    id: 'ghibli',
    name: 'Anime Studio Ghibli',
    icon: 'Sparkles',
    description: 'Estética pintada a mano, acuarelas suaves, cielos luminosos y nostalgia poética',
    promptModifier: 'Studio Ghibli aesthetic, lush hand-painted watercolor background, nostalgic atmosphere, vibrant colors, gentle breeze movement, Makoto Shinkai lighting'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    icon: 'Zap',
    description: 'Luces de neón reflectivas, lluvia en el asfalto, metrópolis futurista y atmósfera oscura',
    promptModifier: 'cyberpunk aesthetic, neon lighting, wet asphalt reflections, futuristic city, volumetric smoke, high contrast cinematic tone'
  },
  {
    id: 'pixar3d',
    name: 'Animación 3D Pixar',
    icon: 'Smile',
    description: 'Personajes expresivos, render 3D suave, iluminación cálida y texturas de alta calidad',
    promptModifier: 'Pixar Disney 3D animation style, subsurface scattering, expressive lighting, charming character design, warm ambient occlusion'
  },
  {
    id: 'vintage',
    name: 'Retro Super 8mm',
    icon: 'Film',
    description: 'Grano analógico, fugas de luz nostálgicas, tonos sepia cálidos y vibra de los años 70',
    promptModifier: 'vintage 1970s Super 8mm film footage, authentic film grain, slight motion jitter, warm nostalgic color grading, light leaks'
  },
  {
    id: 'nature',
    name: 'National Geographic',
    icon: 'Compass',
    description: 'Fauna y flora en su hábitat natural con teleobjetivo y detalle ultra nítido',
    promptModifier: 'National Geographic wildlife documentary style, RED camera 8K, telephoto lens, ultra-sharp natural textures, organic golden hour light'
  },
  {
    id: 'claymation',
    name: 'Claymation Stop-Motion',
    icon: 'Boxes',
    description: 'Modelado en plastilina con huellas sutiles y animación cuadro por cuadro estilo Aardman',
    promptModifier: 'Aardman claymation stop-motion animation, plasticine textures with subtle fingerprint marks, tactile miniature stage, frame-by-frame motion'
  }
];

export const CAMERA_PRESETS: CameraMotionPreset[] = [
  {
    id: 'dynamic',
    name: 'Automático / Fluido',
    icon: 'Video',
    description: 'El modelo elige el movimiento más armónico para la escena',
    promptModifier: 'smooth cinematic camera movement'
  },
  {
    id: 'drone',
    name: 'Vuelo con Dron',
    icon: 'Send',
    description: 'Toma aérea amplia y majestuosa avanzando sobre el paisaje',
    promptModifier: 'sweeping cinematic drone flyover shot, high angle, smooth forward glide over the expansive landscape'
  },
  {
    id: 'pan',
    name: 'Panorámica Suave',
    icon: 'MoveHorizontal',
    description: 'Movimiento horizontal constante de izquierda a derecha revelando el entorno',
    promptModifier: 'slow horizontal camera pan revealing surrounding details, steady tripod movement'
  },
  {
    id: 'dolly_in',
    name: 'Dolly In (Acercamiento)',
    icon: 'ZoomIn',
    description: 'La cámara avanza lentamente hacia el sujeto principal aumentando la emoción',
    promptModifier: 'slow dramatic dolly-in camera push toward the subject, focal center in sharp focus'
  },
  {
    id: 'orbit',
    name: 'Órbita 360° Alrededor',
    icon: 'RotateCw',
    description: 'Giro suave y circular en torno al personaje o elemento central',
    promptModifier: 'orbital 360 camera arc around the subject, keeping focal point locked at center'
  },
  {
    id: 'macro',
    name: 'Macro Lente Extremo',
    icon: 'Eye',
    description: 'Detalle microscópico con desenfoque de fondo bokeh ultra cremoso',
    promptModifier: 'extreme macro probe lens perspective, micro textures in intense focus, ultra creamy bokeh background'
  },
  {
    id: 'static',
    name: 'Plano Fijo Estable',
    icon: 'Camera',
    description: 'Cámara en trípode fijo dejando que la acción ocurra dentro del encuadre',
    promptModifier: 'locked-off tripod static shot, steady composition, movement happening purely within frame'
  }
];

export const SHOWCASE_VIDEOS: ShowcaseItem[] = [
  {
    id: 'ocean-waves',
    title: 'Olas de Cristal al Atardecer Dorado',
    category: 'nature',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Primer plano cinematográfico de una ola turquesa cristalina rompiendo en cámara lenta sobre arena dorada en una playa solitaria durante el atardecer, gotas de agua individuales suspendidas en el aire brillando con el sol poniente.',
    aspectRatio: '16:9',
    duration: '10s',
    resolution: '1080p',
    style: 'National Geographic',
    camera: 'Macro Lente Extremo'
  },
  {
    id: 'cyber-city',
    title: 'Autopista Aérea Cyberpunk Neo-Tokio',
    category: 'scifi',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Toma cinematográfica aérea nocturna siguiendo un vehículo aerodinámico que vuela a través de cañones de rascacielos cubiertos de hologramas gigantes de neón azul y magenta bajo una persistente llovizna futurista.',
    aspectRatio: '16:9',
    duration: '10s',
    resolution: '1080p',
    style: 'Cyberpunk Neón',
    camera: 'Vuelo con Dron'
  },
  {
    id: 'aurora-lake',
    title: 'Aurora Boreal en Fiordos Helados',
    category: 'cinematic',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Vuelo suave y continuo con dron sobre aguas tranquilas de fiordos noruegos que reflejan una imponente cortina de aurora boreal verde y violeta ondulando majestuosamente en el cielo ártico estrellado.',
    aspectRatio: '16:9',
    duration: '10s',
    resolution: '1080p',
    style: 'Cine Fotorrealista',
    camera: 'Vuelo con Dron'
  },
  {
    id: 'bunny-adventure',
    title: 'Bosque Mágico en Primavera 3D',
    category: 'animation',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Personaje animado curioso despertando entre musgo y flores fluorescentes que se abren lentamente mientras la luz del sol matutino atraviesa los árboles en un bosque de cuento de hadas.',
    aspectRatio: '16:9',
    duration: '10s',
    resolution: '720p',
    style: 'Animación 3D Pixar',
    camera: 'Dolly In (Acercamiento)'
  }
];

export const SAMPLE_REFERENCE_IMAGES = [
  {
    id: 'img-robot',
    title: 'Robot Explorador',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    suggestedPrompt: 'El pequeño robot enciende sus luces oculares azules, mira a su alrededor con asombro y levanta su mano mecánica para tocar una mariposa de luz que pasa flotando.'
  },
  {
    id: 'img-cat',
    title: 'Gatito en Jardín',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    suggestedPrompt: 'El gato bosteza lentamente, parpadea con ojos ámbar y salta con agilidad sobre una roca cubierta de hojas secas que vuelan con el viento.'
  },
  {
    id: 'img-mountain',
    title: 'Montañas al Amanecer',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    suggestedPrompt: 'Niebla espesa fluye como un río entre los valles montañosos mientras los primeros rayos dorados del sol iluminan los picos nevados en un time-lapse hiperrealista.'
  }
];
