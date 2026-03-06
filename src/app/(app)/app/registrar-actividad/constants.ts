// v=4 evita caché del navegador tras actualizar imágenes
const IMG_V = "v4";
export const ACTIVITY_TYPES = [
  { value: "walking", label: "Andar", image: `/images/activities/walking.png?${IMG_V}` },
  { value: "cycling", label: "Bici", image: `/images/activities/cycling.png?${IMG_V}` },
  { value: "running", label: "Correr", image: `/images/activities/running.png?${IMG_V}` },
  { value: "yoga", label: "Yoga", image: `/images/activities/yoga.png?${IMG_V}` },
  { value: "meditation", label: "Meditación", image: `/images/activities/meditation.png?${IMG_V}` },
  { value: "gym", label: "Gimnasio", image: `/images/activities/gym.png?${IMG_V}` },
  { value: "swimming", label: "Nadar", image: `/images/activities/swimming.png?${IMG_V}` },
  { value: "hiking", label: "Senderismo", image: `/images/activities/hiking.png?${IMG_V}` },
  { value: "stretching", label: "Estiramientos", image: `/images/activities/stretching.png?${IMG_V}` },
] as const;

export const TIME_PRESETS = [15, 30, 45, 60] as const;
