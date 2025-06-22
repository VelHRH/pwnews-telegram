export enum UrlEntity {
  WEBSITE = 'WEBSITE',
  CHANNEL = 'CHANNEL',
  CHAT = 'CHAT',
}

export const UrlConfig = {
  [UrlEntity.WEBSITE]: {
    name: 'Сайт',
    url: 'https://pwnews.net/news/',
  },
  [UrlEntity.CHANNEL]: {
    name: 'Канал',
    url: 'https://t.me/pwnewsnet',
  },
  [UrlEntity.CHAT]: {
    name: 'Чат',
    url: 'https://t.me/+y6U7hiFWWRtiY2Fi',
  },
};
