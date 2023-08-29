module.exports = {
  title: 'Ma Xiao Chun',
  description: '一个写给自己看的博客',
  theme: 'reco',
  base: '/blogs/',
  themeConfig: {
    type: "blog",
    logo:"/avatar.jpg",
    authorAvatar:"/avatar.jpg",
    nav: [
      { text: "首页", link: "/" },
      // {
      //   text: "Shark Xu 的博客",
      //   items: [
      //     { text: "掘金", link: "https://juejin.cn/user/233526039432445" },
      //     { text: "Github", link: "https://github.com/Xusssyyy" }
      //   ]
      // }
    ],
    blogConfig: {
      category: {
        location: 2, // 在导航栏菜单中所占的位置，默认2
        text: "博客", // 默认文案 “分类”
      },
      tag: {
        location: 4, // 在导航栏菜单中所占的位置，默认4
        text: "Tag", // 默认文案 “标签”
      },
    },
  },
  plugins: [
    [
      "sakura",
      {
        num: 20, // 默认数量
        show: true, //  是否显示
        zIndex: -1, // 层级
        img: {
          replace: false, // false 默认图 true 换图 需要填写httpUrl地址
        },
      },
    ],
    [
      "cursor-effects",
      {
        size: 4, // size of the particle, default: 2
        shape: "star", // ['star' | 'circle'], // shape of the particle, default: 'star'
        zIndex: 999999999, // z-index property of the canvas, default: 999999999
      },
    ],
    [
      "@vuepress-reco/vuepress-plugin-bgm-player",
      {
        audios: [
          {
            name: "稻香",
            artist: "稻香",
            url: "http://music.163.com/song/media/outer/url?id=2064507559.mp3",
            cover: "http://p1.music.126.net/cxPpKb42FUfIyFFS3s8KYw==/109951168743952431.jpg?param=300x300",
          },
          {
            name: "稻香",
            artist: "稻香",
            url: "http://music.163.com/song/media/outer/url?id=2064507559.mp3",
            cover: "http://p1.music.126.net/cxPpKb42FUfIyFFS3s8KYw==/109951168743952431.jpg?param=300x300",
          },
        ],
        // 是否默认缩小
        autoShrink: true,
        // 缩小时缩为哪种模式
        shrinkMode: "float",
        // 悬浮窗样式
        floatStyle: { bottom: "20px", "z-index": "999999" },
      },
    ],
  ],
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
}
