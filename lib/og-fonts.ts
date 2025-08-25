async function loadGoogleFont(font: string, text: string, weight = '400') {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(url)).text()
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)

  if (resource) {
    const response = await fetch(resource[1])
    if (response.status === 200) {
      return await response.arrayBuffer()
    }
  }

  throw new Error(`Failed to load font data for ${font}`)
}

export async function loadFonts(text: string) {
  try {
    const [interData, frauncesData] = await Promise.all([
      loadGoogleFont('Inter', text, '400'),
      loadGoogleFont('Fraunces', text, '700'),
    ])

    return [
      {
        name: 'Inter',
        data: interData,
        style: 'normal' as const,
        weight: 400 as const,
      },
      {
        name: 'Fraunces',
        data: frauncesData,
        style: 'normal' as const,
        weight: 700 as const,
      },
    ]
  } catch (error) {
    console.error('Failed to load custom fonts:', error)
    return []
  }
}