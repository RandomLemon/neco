import { api, BASE_URL } from './api'
import type { NewsSegment } from './newslist'

export interface DocumentBrief {
  id: string
  title: string
}

export interface DocumentEntity {
  id: string
  title: string
  description: string
  category: string
  tab: string
  priority: number
  content: NewsSegment

  // response only
  contributors?: string[] // usernames
  createTime?: string // yyyy-MM-dd
  updateTime?: string // yyyy-MM-dd

  // request only
  contributor?: string // username
}

export const NewDocumentCategory = async (category: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/document/category`, {
      category: category,
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const DeleteDocumentCategory = async (category: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch(`/document/category`, {
      category: category,
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const GetAllCategories = async (): Promise<string[]> => {
  let result: string[] = []
  await api
    .get('/document/categories')
    .then((res) => {
      result = (res.data.categories || []) as string[]
    })
    .catch(() => {})
  return result
}

export const NewDocumentTab = async (category: string, tab: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/document/tab`, {
      category: category,
      tab: tab,
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const DeleteDocumentTab = async (category: string, tab: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch(`/document/tab`, {
      category: category,
      tab: tab,
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const GetAllTabs = async (category: string): Promise<string[]> => {
  let result: string[] = []
  await api
    .post(`/document/tabs`, {
      category: category,
    })
    .then((res) => {
      result = (res.data.tabs || []) as string[]
    })
    .catch(() => {})
  return result
}

export const GetDocuments = async (category: string, tab: string): Promise<DocumentBrief[]> => {
  let result: DocumentBrief[] = []
  await api
    .post(`/document/list`, {
      category: category,
      tab: tab,
    })
    .then((res) => {
      result = (res.data.documents || []) as DocumentBrief[]
    })
    .catch(() => {})
  return result
}

export const GetDocument = async (id: string): Promise<DocumentEntity | null> => {
  let result: DocumentEntity | null = null
  await api
    .get(`/document/${id}`)
    .then((res) => {
      result = res.data as DocumentEntity
    })
    .catch(() => {})
  return result
}

export const RequireDocumentId = async (): Promise<string | null> => {
  let result: string | null = null
  await api
    .post('/document/id')
    .then((res) => {
      if (res.data.id) {
        result = res.data.id as string
      }
    })
    .catch(() => {})
  return result
}

export const UploadDocumentFile = async (id: string, file: File): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(
      `/document/upload/${id}`,
      {
        file: file,
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    .then((res) => {
      if (res.data.url) {
        result = BASE_URL + res.data.url
      }
    })
    .catch(() => {})
  return result
}

export const DeleteDocumentFile = async (id: string, url: string): Promise<string | null> => {
  let result = null
  await api
    .post(`/document/delete/${id}`, {
      url: url.replace(BASE_URL, ''),
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const DeleteDocument = async (id: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .delete(`/document/${id}`)
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const UpdateDocument = async (document: DocumentEntity): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch(`/document/${document.id}`, document)
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}
