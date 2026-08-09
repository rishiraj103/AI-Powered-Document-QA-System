import axios from 'axios'

const api = axios.create({ timeout: 120000 })

function errorMessage(error, fallback) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => item.msg).join(', ')
  return detail || (error.code === 'ECONNABORTED' ? 'The request took too long. Please try again.' : fallback)
}

export async function checkHealth() {
  const response = await api.get('/health', { timeout: 8000 })
  return response.data
}

export async function uploadDocuments(files) {
  const form = new FormData()
  files.forEach(file => form.append('files', file))
  try {
    const response = await api.post('/upload', form)
    return response.data
  } catch (error) {
    throw new Error(errorMessage(error, 'The documents could not be uploaded. Check the backend and try again.'))
  }
}

export async function askQuestion(question) {
  try {
    const response = await api.post('/query', { question })
    return response.data
  } catch (error) {
    throw new Error(errorMessage(error, 'The question could not be processed. Please try again.'))
  }
}
