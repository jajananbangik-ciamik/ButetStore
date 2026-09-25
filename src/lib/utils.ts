export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function todayInputValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export type VideoSource =
  | { type: 'embed'; src: string }
  | { type: 'file'; src: string }

function isYoutubeHost(hostname: string) {
  return hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtube-nocookie.com' || hostname.endsWith('.youtube-nocookie.com')
}

function isVimeoHost(hostname: string) {
  return hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com') || hostname === 'player.vimeo.com'
}

function youtubeId(url: URL) {
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] || ''
  }
  if (!isYoutubeHost(hostname)) {
    return ''
  }
  if (url.pathname === '/watch') {
    return url.searchParams.get('v') || ''
  }
  const pathMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)
  return pathMatch ? pathMatch[1] : ''
}

function vimeoId(url: URL) {
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'player.vimeo.com') {
    return url.pathname.split('/').filter(Boolean)[0] || ''
  }
  if (!isVimeoHost(hostname)) {
    return ''
  }
  return url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part)) || ''
}

export function getVideoSource(value?: string): VideoSource | null {
  const raw = String(value || '').trim()
  if (!raw) {
    return null
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') {
    return null
  }
  const youtube = youtubeId(url)
  if (/^[A-Za-z0-9_-]{6,}$/.test(youtube)) {
    return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}` }
  }
  const vimeo = vimeoId(url)
  if (/^\d+$/.test(vimeo)) {
    return { type: 'embed', src: `https://player.vimeo.com/video/${encodeURIComponent(vimeo)}` }
  }
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(url.pathname)) {
    return { type: 'file', src: url.toString() }
  }
  return null
}
