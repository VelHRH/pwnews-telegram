import { SceneContext } from 'telegraf/typings/scenes';

interface SceneSession {
  step?: 'url';
  url?: string;
}

export interface Context extends SceneContext {
  scene: SceneContext['scene'] & {
    session: SceneSession;
  };
}
