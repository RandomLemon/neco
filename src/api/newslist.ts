import { useToast } from 'vue-toastification'
import { api } from './api'
import type { UserEntity } from './auth'

const toast = useToast()

export interface NewsEntity {
  id?: string
  pin: boolean
  title: string
  brief: string
  date: string
  endDate?: string
  image: string
}

export type NewsSegmentType = 'markdown' | 'pdf_file'

export interface NewsSegment {
  type: NewsSegmentType
  content: string
}

export interface NewsDetail {
  entity: NewsEntity
  content: NewsSegment[]
  author: UserEntity
  category: string
}

export type NewsTarget = 'information' | 'magazine' | 'notice' | 'activity' | 'document'

export const GetNewsTotal = async (target: NewsTarget): Promise<number> => {
  let result = 0
  await api
    .get(`/news/total/${target}`)
    .then((res) => {
      result = res.data.total
    })
    .catch(() => {})
  return result
}

export const GetNews = async (
  target: NewsTarget,
  page: number,
  pageSize: number,
): Promise<Array<NewsEntity>> => {
  let result: Array<NewsEntity> = []
  await api
    .post('/news/list', {
      target: target,
      page: page,
      page_size: pageSize,
      pin: false,
    })
    .then((res) => {
      result = res.data.list as Array<NewsEntity>
    })
    .catch(() => {})
  return result
}

export const GetNewsDetail = async (id: string): Promise<NewsDetail | null> => {
  let result: NewsDetail | null = null
  await api
    .get(`/news/detail/${id}`)
    .then((res) => {
      result = res.data as NewsDetail
    })
    .catch(() => {})
  return result
}

export const GetNewsBrief = async (): Promise<Array<NewsEntity>> => {
  const result: Array<NewsEntity> = [
    {
      id: '',
      pin: true,
      image: '',
      title: '',
      brief: '',
      date: '',
    },
    {
      id: '',
      pin: true,
      image: '',
      title: '',
      brief: '',
      date: '',
    },
    {
      id: '',
      pin: true,
      image: '',
      title: '',
      brief: '',
      date: '',
    },
    {
      id: '',
      pin: true,
      image: '',
      title: '',
      brief: '',
      date: '',
    },
  ]
  let success = true
  await api
    .post(`/news/list`, {
      target: 'activity',
      page: 1,
      page_size: 1,
      pin: true,
    })
    .then((res) => {
      result[0] = res.data.list[0] as NewsEntity
    })
    .catch(() => {
      success = false
    })
  await api
    .post(`/news/list`, {
      target: 'information',
      page: 1,
      page_size: 1,
      pin: true,
    })
    .then((res) => {
      result[1] = res.data.list[0] as NewsEntity
    })
    .catch(() => {
      success = false
    })
  await api
    .post(`/news/list`, {
      target: 'magazine',
      page: 1,
      page_size: 1,
      pin: true,
    })
    .then((res) => {
      result[2] = res.data.list[0] as NewsEntity
    })
    .catch(() => {
      success = false
    })
  await api
    .post(`/news/list`, {
      target: 'notice',
      page: 1,
      page_size: 1,
      pin: true,
    })
    .then((res) => {
      result[3] = res.data.list[0] as NewsEntity
    })
    .catch(() => {
      success = false
    })
  if (!success) {
    toast.warning('请求置顶新闻失败！')
  }
  return result
}

export const UploadFile = async (id: string, file: File): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/news/upload/${id}`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => {
      if (res.data.url) {
        result = res.data.url
      }
    })
    .catch(() => {})
  return result
}

export const DeleteFile = async (id: string, url: string): Promise<string | null> => {
  let result = null
  await api
    .post(`/news/delete/${id}`, {
      url: url,
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

export const UpdateNews = async (
  id: string,
  category: NewsTarget,
  entity: NewsEntity,
  content: NewsSegment[],
): Promise<string | null> => {
  let result = null
  await api
    .patch(`/news/${id}`, {
      category: category,
      entity: entity,
      content: content,
    })
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const CreateNews = async (): Promise<string | null> => {
  let result = null
  await api
    .post(`/news/create`)
    .then((response) => {
      if (response.data.id) {
        result = response.data.id
      }
    })
    .catch(() => {})
  return result
}

export const DeleteNews = async (id: string): Promise<string | null> => {
  let result = null
  await api
    .delete(`/news/${id}`)
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}
