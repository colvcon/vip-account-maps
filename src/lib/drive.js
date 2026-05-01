// Google Drive integration
// Account maps are stored as JSON files in a dedicated Drive folder
// Folder name: "VIP Account Maps" — created on first use

const FOLDER_NAME = 'VIP Account Maps'
const FILE_PREFIX = 'vip-map-'

function getToken() {
  return localStorage.getItem('gd_token')
}

export function setToken(token) {
  localStorage.setItem('gd_token', token)
}

export function clearToken() {
  localStorage.removeItem('gd_token')
}

export function isAuthenticated() {
  return !!getToken()
}

async function gdFetch(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  })
  if (res.status === 401) {
    clearToken()
    throw new Error('AUTH_EXPIRED')
  }
  return res
}

async function getOrCreateFolder() {
  const search = await gdFetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`
  )
  const { files } = await search.json()
  if (files && files.length > 0) return files[0].id

  const create = await gdFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  })
  const folder = await create.json()
  return folder.id
}

export async function listAccountMaps() {
  const folderId = await getOrCreateFolder()
  const res = await gdFetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name contains '${FILE_PREFIX}' and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`
  )
  const { files } = await res.json()
  const maps = await Promise.all(
    (files || []).map(async f => {
      const content = await readFile(f.id)
      return { ...content, fileId: f.id, modifiedTime: f.modifiedTime }
    })
  )
  return maps
}

async function readFile(fileId) {
  const res = await gdFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  )
  return res.json()
}

export async function getAccountMap(fileId) {
  return readFile(fileId)
}

export async function saveAccountMap(mapData) {
  const folderId = await getOrCreateFolder()
  const slug = mapData.domain.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const fileName = `${FILE_PREFIX}${slug}.json`

  // Check if file already exists
  const search = await gdFetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name='${fileName}' and trashed=false&fields=files(id)`
  )
  const { files } = await search.json()
  const payload = JSON.stringify({ ...mapData, savedAt: new Date().toISOString() })

  if (files && files.length > 0) {
    // Update existing
    await gdFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${files[0].id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }
    )
    return files[0].id
  } else {
    // Create new
    const meta = await gdFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/related; boundary=BOUNDARY'
        },
        body: [
          '--BOUNDARY',
          'Content-Type: application/json',
          '',
          JSON.stringify({ name: fileName, parents: [folderId] }),
          '--BOUNDARY',
          'Content-Type: application/json',
          '',
          payload,
          '--BOUNDARY--'
        ].join('\r\n')
      }
    )
    const file = await meta.json()
    return file.id
  }
}
