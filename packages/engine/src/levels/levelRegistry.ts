import { LevelConfig } from './levelConfig';
import { LEVEL_1_CONFIG } from './level1Config';
import { LEVEL_2_CONFIG } from './level2Config';
import { LEVEL_3_CONFIG } from './level3Config';
import { LEVEL_4_CONFIG } from './level4Config';
import { LEVEL_5_CONFIG } from './level5Config';

class LevelRegistryManager {
  private configs: Record<number, LevelConfig> = {
    1: { ...LEVEL_1_CONFIG },
    2: { ...LEVEL_2_CONFIG },
    3: { ...LEVEL_3_CONFIG },
    4: { ...LEVEL_4_CONFIG },
    5: { ...LEVEL_5_CONFIG }
  };

  private activeLevelId: number = 1;

  public getAllConfigs(): LevelConfig[] {
    return Object.values(this.configs);
  }

  public getLevelConfig(id: number): LevelConfig {
    return this.configs[id] || this.configs[1];
  }

  public getActiveConfig(): LevelConfig {
    return this.getLevelConfig(this.activeLevelId);
  }

  public getActiveLevelId(): number {
    return this.activeLevelId;
  }

  public setActiveLevelId(id: number): LevelConfig {
    if (this.configs[id]) {
      this.activeLevelId = id;
    }
    return this.getActiveConfig();
  }

  public setUsePrimitives(id: number, usePrimitives: boolean): void {
    if (this.configs[id]) {
      this.configs[id].usePrimitives = usePrimitives;
    }
  }

  public isPrimitives(id: number): boolean {
    return this.configs[id] ? this.configs[id].usePrimitives : false;
  }
}

export const levelRegistry = new LevelRegistryManager();
