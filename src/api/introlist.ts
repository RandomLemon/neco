export interface IntroEntity {
  title: string
  description: string
  image: string
}

export const GetIntroList = (): IntroEntity[] => {
  return [
    {
      title: `“像素南雍”复原工程`,
      description: `南大仙林、鼓楼、苏州校区复原工作，在方块的世界构筑云端的校园。社团常态化项目，建筑服务器创造建筑，2024暑期社会实践校重点项目。`,
      image: import.meta.env.BASE_URL + 'resources/restore/北大楼.jpg',
    },
    {
      title: `NMO 群组服务器系列`,
      description: `原版生存，模组生存，建筑，小游戏，RPG，空岛生存，Bingo……多种多样的玩法供你选择！我们的服务器由群组服及其子服和若干个独立服务器组成，详情请点击上面的菜单栏查看其它页面哦～`,
      image: import.meta.env.BASE_URL + 'resources/server/模组2.jpg',
    },
    {
      title: `部门风采`,
      description: `NMO 下设社团办事处、宣传美工部、运维保障部、活动部、外联部，分别管理社团各项事务，维持社团运转。部门活动丰富多彩，既能学到，也能玩到。`,
      image: import.meta.env.BASE_URL + 'resources/nmo十载合照.jpg',
    },
    {
      title: `线下活动`,
      description: `Minecraft 社团不只有线上，线下社团活动才是注入灵魂。社团文化夜、百团大战、星光集市等社管主办的活动，2-50人规模不等的约饭，春游，学术讲座……来这里一起交友，充实你的社团生活吧！`,
      image: import.meta.env.BASE_URL + 'resources/线下合照.jpg',
    },
  ]
}

export const GetDetailedIntroList = (): IntroEntity[] => {
  return [
    {
      title: `“像素南雍”复原工程`,
      description: `南大仙林、鼓楼、苏州校区复原工作，在方块的世界构筑云端的校园。社团常态化项目，建筑服务器创造建筑，2024暑期社会实践校重点项目。`,
      image: '',
    },
    {
      title: `仙林复原工程`,
      description: `始于2017年，2022年基本完工，社团成立的“敲门砖”，宣传视频的“招牌作”，创社社长AircraftCarrierX的史诗之作。`,
      image: import.meta.env.BASE_URL + 'resources/restore/杜厦图书馆2.jpg',
    },
    {
      title: `鼓楼复原工程`,
      description: `始于2023年，主要由建筑大师黄喵和服务器管理Chino_Zhou完成。目前缺少地景和内饰，火热招募中！（请联系Stridebeach）2024年暑期社会实践校重点项目，2024年“兴泉基金”项目，毛概社会实践项目。`,
      image: import.meta.env.BASE_URL + 'resources/restore/鼓楼校区大门.jpg',
    },
    {
      title: `苏州复原工程`,
      description: `始于2025年，紧张筹备中。`,
      image: import.meta.env.BASE_URL + 'resources/restore/鼓楼宿舍.jpg',
    },
    {
      title: `VR 看校园`,
      description: `第一人称视角漫步方块校园！请关注我们的展台活动，以第一时间前来体验不一样的VR体验！`,
      image: import.meta.env.BASE_URL + 'resources/restore/大礼堂内部.jpg',
    },
    {
      title: `NMO 群组服务器系列`,
      description: `原版生存，模组生存，建筑，小游戏，RPG，空岛生存，Bingo……多种多样的玩法供你选择！我们的服务器由群组服及其子服和若干个独立服务器组成，详情请点击上面的菜单栏查看其它页面哦～`,
      image: '',
    },
    {
      title: `NMO 长期原版生存服`,
      description: `原版生存，长期发展，不限玩法。高校Minecraft圈最活跃的服务器。生存、建筑、城建、铁道、生电、节日活动、小游戏……由多个地图拼成的长期服务器，期待你的加入！\n该服务器无周目制，不回档，定期更新版本或增加新地图。`,
      image: import.meta.env.BASE_URL + `resources/server/星辰据点.jpg`,
    },
    {
      title: `NMO 模组服系列`,
      description: `机械动力、格雷科技、植物魔法、匠魂工艺……模组科技带来比原版更精彩的玩法！想玩什么模组你来定！暑期新服火热招新中，等你来开荒！详745812246。\n目前，以机械动力等模组为核心的生存建设向模组一服无周目制，不回档。模组二服供大家体验更多模组与整合包玩法，实施周目制`,
      image: import.meta.env.BASE_URL + 'resources/server/模组3.jpg',
    },
    {
      title: `NFCC 与小游戏活动`,
      description: `NFCC是NMO定期举办的竞技活动，由多个精彩刺激的小游戏项目组成。通过NMO还可定期参与MUA举办的各种小游戏赛事，与来自其他学校的同学们一起组队切磋！`,
      image: import.meta.env.BASE_URL + 'background/list-background.jpg',
    },
    {
      title: `部门风采`,
      description: `NMO下设社团办事处、宣传美工部、运维保障部、活动部、外联部，分别管理社团各项事务，维持社团运转。部门活动丰富多彩，既能学到，也能玩到。`,
      image: '',
    },
    {
      title: `宣传美工部-文案部`,
      description: `分享快乐，记录生活，NMO出品，必属精品。社团大事、服务器新闻、自由创作甚至AIGC，都欢迎投稿，让你的精彩被更多人发现！前往社刊页面即可投稿！（但是这个功能还没做😭）`,
      image: import.meta.env.BASE_URL + `background/main-background.jpg`,
    },
    {
      title: `宣传美工部-动画组`,
      description: `让Minecraft的世界“生”“动”起来！NMO动画组是MUA各高校最大的Minecraft动画交流组织。精美场景渲染、超酷动画制作、相关软件教学。还有定期的“你画我猜”与贺图互换活动哦。详479223524。`,
      image: import.meta.env.BASE_URL + 'resources/groups/动画组.jpg',
    },
    {
      title: `运维保障部`,
      description: `这里聚集了NMO的技术人员，是服务器、皮肤站和社团各网站稳定运行的幕后英雄。LINUX服务器操作，数据包、插件、模组编写，网站维护，服务端组装与维护，欢迎大佬的同时也对零基础萌新敞开大门。超浓厚的学习交流氛围！还有群友交流女装、音游和硬件哦~(bushi)`,
      image: import.meta.env.BASE_URL + 'background/list-background.jpg',
    },
    {
      title: `外联部`,
      description: `NMO社团的“外交官”，负责与其他高校Minecraft社团的交流合作，举办各类线上线下活动。欢迎志同道合的你加入我们，一起为Minecraft圈的发展做出贡献！`,
      image: import.meta.env.BASE_URL + 'background/main-background.jpg',
    },
  ]
}
