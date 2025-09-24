import { api } from './api'

export const GetSlogan = async (): Promise<string> => {
  let result = ''
  await api
    .get('/slogan')
    .then((res) => {
      result = res.data.slogan
    })
    .catch(() => {
      result = '哎呀！与后端失去联系了'
    })
  return result
}
