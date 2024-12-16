import { 
  AppConfig, 
  Site, 
  AvatarConfig, 
  Link, 
  SitesConfig, 
  SlidersConfig,
  SocialConfig,
  SubTitleConfig,
  FooterConfig,
  GlobalStyle,
  BgConfig,
  LayoutConfig,
  Resources,
  Slider
} from './config.d';

export type { 
  AppConfig,
  Site, 
  AvatarConfig, 
  Link, 
  SitesConfig, 
  SlidersConfig,
  SocialConfig,
  SubTitleConfig,
  FooterConfig,
  GlobalStyle,
  BgConfig,
  LayoutConfig,
  Resources,
  Slider
};

export const siteConfig: AppConfig = {
  name: '您的站点名称',
  favicon: '/favicon.ico',
  avatarConfig: {
    src: '/1.png',
    size: 130,
    round: 'full',
    style: 'glint',
    hoverAnimate: 'top'
  },
  bgConfig: {
    bg: '/bg.jpg',
    blur: 'sm',
    cardOpacity: 0.1
  },
  links: [
    {
      title: 'GitHub',
      url: 'https://github.com/yourusername',
      icon: 'github'
    }
  ],
  sites: [
    {
      title: '我的项目',
      url: 'https://example.com',
      desc: '项目描述'
    }
  ],
  subTitle: 'https://v1.hitokoto.cn?c=a&c=b&c=c',
  subTitleConfig: {
    typing: true,
    heart: true
  },
  globalStyle: {
    theme: 'light'
  }
}; 