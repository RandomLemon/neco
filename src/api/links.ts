export interface LinkEntry {
  name: string
  url: string
  icon: string
  description: string
}

export const GetLinkEntries = (): LinkEntry[] => {
  return [
    {
      name: 'NMO 皮肤站',
      url: 'https://skin.nmo.net.cn/',
      icon: 'https://skin.nmo.net.cn/app/NMO_intel.ico',
      description: '使用 NMO 皮肤站即可畅玩服务器，无需正版账号',
    },
    {
      name: 'bilibili 官方账号',
      url: 'https://space.bilibili.com/646892894',
      icon: '/nmo-logo.png',
      description: '来 Bilibili 关注 NMO 社团的最新动态',
    },
    {
      name: 'GitHub 源码',
      url: 'https://github.com/EntropyGenerator/neco',
      icon: '/blockbg/red-wool.png',
      description: 'Neco 前端项目开源仓库',
    },
    {
      name: '香草图书馆',
      url: 'https://vanillalibrary.mcfpp.top/datapack-index/',
      icon: '/otherlogos/vanillalibrary.png',
      description: 'Minecraft 数据包与资源索引引导页面，相当详细的教程',
    },
    {
      name: '东南大学六朝松信标社',
      url: 'https://seubcl.cn',
      icon: '/friend-logo/bcl_logo.png',
      description: '东南大学 Minecraft 社团广告位',
    },
    {
      name: 'USTCraft 像素艺术小组',
      url: 'https://ustcraft.github.io/website/',
      icon: '/friend-logo/ustcraft_logo.png',
      description: '中国科学技术大学 Minecraft 社团广告位',
    },
    {
      name: 'Minecraft 中文 Wiki',
      url: 'https://zh.minecraft.wiki/',
      icon: '/otherlogos/wiki.png',
      description: '最全面的 Minecraft 中文资料库',
    },
    {
      name: 'MC 百科',
      url: 'https://www.mcmod.cn/',
      icon: '/otherlogos/mcmod.png',
      description: '全面便携的 Minecraft 中文模组资料库',
    },
    {
      name:'Modrinth',
      url:'https://modrinth.com/',
      icon:'/otherlogos/modrinth.png',
      description:' Minecraft模组分发平台，下载模组，光影，插件，数据包等等的不二之选'
    },
    {
      name: 'CurseForge',
      url: 'https://www.curseforge.com/minecraft/mc-mods',
      icon: '/otherlogos/curseforge.png',
      description: 'CurseForge 是一个用于 Minecraft 模组的分发平台',
    },

  ]
}
