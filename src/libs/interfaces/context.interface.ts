import { Context as TelegrafContext } from 'telegraf';
import { SceneContextScene } from 'telegraf/typings/scenes';

export interface Context extends TelegrafContext {
  scene: SceneContextScene;
}
