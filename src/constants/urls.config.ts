export enum UrlEntity {
  WEBSITE = 'WEBSITE',
  CHANNEL = 'CHANNEL',
  CHAT = 'CHAT',
  REVIEWS = 'REVIEWS',
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
  [UrlEntity.REVIEWS]: {
    name: 'Обзоры',
    url: 'https://pwnews.net/news/1-0-23',
  },
};
