import { api, BASE_URL } from "./api";
import type { NewsSegment } from "./newslist";

export interface DocumentNode {
  parendId: string;
  id: string;
  isFolder: boolean;
  private: boolean;

  name: string;
  contributors?: string[];
  content?: NewsSegment[];
  updateTime?: string;
}

export const DeleteDocument = async (targetId: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .delete(`/documents/node/${targetId}`)
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((err) => {
      if (err.response.data.error) {
        result = err.response.data.error
      }
    })
  return result
}

export const RebindDocument = async (targetId: string, parentId: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/documents/node/${targetId}`, {
      parentId: parentId
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((err) => {
      if (err.response.data.error) {
        result = err.response.data.error
      }
    })
  return result
}

export const RenameDocument = async (targetId: string, name: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch(`/documents/node/${targetId}`, {
      name: name
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((err) => {
      if (err.response.data.error) {
        result = err.response.data.error
      }
    })
  return result
}

export const UpdateDocument = async (targetId: string, isPrivate: boolean, content: NewsSegment[]): Promise<string | null> => {
  let result: string | null = null
  await api
    .put(`/documents/node/${targetId}`, {
      private: isPrivate,
      content: content
    })
    .then((res) => {
      if (res.data.error) {
        result = res.data.error
      }
    })
    .catch((err) => {
      if (err.response.data.error) {
        result = err.response.data.error
      }
    })
  return result
}

export interface CreateDocumentForm {
  parentId: string;
  isFolder: boolean;
  private: boolean;
  name: string;
}

export const CreateDocument = async (form: CreateDocumentForm): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/documents/node`, form)
    .then((res) => {
      if (res.data.id) {
        result = res.data.id
      }
    })
    .catch(() => {})
  return result
}

export const GetDocumentLayer = async (parentId: string): Promise<DocumentNode[]> => {
  let result: DocumentNode[] = []
  await api
    .get(`/documents/layer${(localStorage.getItem('token') || '')?.trim() === '' ? '' : '/private'}/${parentId}`)
    .then((res) => {
      result = res.data.children as DocumentNode[]
    })
    .catch(() => {})
  return result
}

export const GetDocumentDetail = async (targetId: string): Promise<DocumentNode | null> => {
  let result: DocumentNode | null = null
  await api
    .get(`/documents${(localStorage.getItem('token') || '')?.trim() === '' ? '' : '/private'}/${targetId}`)
    .then((res) => {
      result = res.data as DocumentNode
    })
    .catch(() => {})
  return result
}

export const UploadDocumentFile = async (targetId: string, file: File): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/documents/upload/${targetId}`, {
      file: file
    }, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => {
      if (res.data.url) {
        result = BASE_URL + res.data.url
      }
    })
    .catch(() => {})
  return result
}

export const DeleteDocumentFile = async (targetId: string, url: string): Promise<string | null> => {
  let result = null
  await api
    .post(`/document/upload/${targetId}`, {
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
