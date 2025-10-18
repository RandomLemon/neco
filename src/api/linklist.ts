export interface LinkEntity {
  name: string
  image: string
  url: string
  description: string
}

export const GetLinkList = (): LinkEntity[] => {
  return [
    {
      name: 'NMO皮肤站',
      image: 'https://skin.nmo.net.cn/app/NMO_intel.ico',
      url: 'https://skin.nmo.net.cn/',
      description: '使用NMO皮肤站即可畅玩服务器，无需正版账号！',
    },
    {
      name: 'bilibili',
      image: 'https://www.mualliance.cn/wp-content/uploads/2023/01/%E5%8D%97%E4%BA%AC%E5%A4%A7%E5%AD%A6.png',
      url: 'https://space.bilibili.com/646892894',
      description: '来 Bilibili 关注社团的最新动态！',
    },
    {
      name: 'GitHub',
      image: '/loading.gif',
      url: 'https://github.com/EntropyGenerator/neco',
      description: '嘻嘻，我一定要活下去！',
    },
  ]
}
