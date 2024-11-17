import type { Resource } from "./game"

export const getElementalColor = (element: Resource) => {
  switch(element) {
    case "Holy":
      return "#ffffff"
    case "Fire":
      return "#f87171"
    case "Thunder":
      return "#fbbf24"
    case "Wind":
      return "#2dd4bf"
    case "Water":
      return "#60a5fa"
    case "Stone":
      return "#fb923c"
    case "Plant":
      return "#a3e635"
    case "Dark":
      return "#e879f9"
    case "Cyber":
      return "#c4d4e0"
    case "Space":
      return "102336"
  }
}

export const getElementalGradientStyle = (elementSet: Set<Resource>) => {
  const elements = [...elementSet]
  if (elements.length === 0) return {"background-color": "rgb(170, 170, 170)"}
  if (elements.length === 1) return {"background-color": getElementalColor(elements[0])}
  let pairs = []
  let nextStop = 0
  for (const element of elements) {
    pairs.push(`${getElementalColor(element)} ${nextStop}%`)
    nextStop += 100 / (elements.length - 1)
  }
  const deg = elements.length <= 2 ? 180 : 135
  return {"background-image": `linear-gradient(${deg}deg, ${pairs.join(', ')})`}
}