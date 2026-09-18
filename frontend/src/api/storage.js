const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BUCKET = 'nexchat-media'

/**
 * Upload a file to Supabase Storage.
 * @param {File} file
 * @param {string} userId - Uploader's ID (used in the file path)
 * @param {function} onProgress - Called with progress 0-100
 * @returns {{ file_url: string, file_name: string, file_type: string, file_size: number }}
 */
export async function uploadFile(file, userId, onProgress = () => {}) {
  const ext = file.name.split('.').pop()
  const uniqueName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${uniqueName}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uniqueName}`
        resolve({
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText} (${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))

    xhr.open('POST', uploadUrl)
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)
    xhr.setRequestHeader('x-upsert', 'false')

    const formData = new FormData()
    formData.append('', file)
    xhr.send(formData)
  })
}

/**
 * Returns whether a file type is an image.
 */
export function isImage(fileType) {
  return fileType?.startsWith('image/')
}

/**
 * Returns whether a file type is a video.
 */
export function isVideo(fileType) {
  return fileType?.startsWith('video/')
}

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
