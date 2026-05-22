import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TilingSprite,
} from 'pixi.js';
import type {
  Bullet,
  Collectible,
  Enemy,
  Particle as GameParticle,
  PlayerShip,
  PowerUp,
  RewardPopup,
  Star,
} from '../types';
import { STAR_COUNT, STAR_LAYERS, STAR_REDRAW_INTERVAL } from '../constants';
import type { GameTextures } from './TextureFactory';
import type { VfxSystem } from './VfxSystem';

export class RenderSystem {
  readonly root: Container;
  readonly world: Container;
  private bgLayer: Container;
  private starLayer: Graphics;
  private entityLayer: Container;
  private projectileLayer: Container;
  private vfxLayer: Container;
  private uiLayer: Container;
  private nebula: TilingSprite | null = null;
  private vignette: Graphics | null = null;
  private flashOverlay: Graphics;
  private stars: Star[] = [];
  private starFrame = 0;

  private playerSprite: Sprite | null = null;
  private enemySprites = new Map<Enemy, Sprite>();
  private bulletSprites = new Map<Bullet, Sprite>();
  private powerSprites = new Map<PowerUp, Sprite>();
  private collectibleSprites = new Map<Collectible, Sprite>();
  private popupTexts = new Map<RewardPopup, Text>();
  private particleGfx: Graphics;

  constructor(
    private app: Application,
    private textures: GameTextures,
    private vfx: VfxSystem,
  ) {
    this.root = new Container();
    this.bgLayer = new Container();
    this.starLayer = new Graphics();
    this.entityLayer = new Container();
    this.projectileLayer = new Container();
    this.vfxLayer = new Container();
    this.uiLayer = new Container();
    this.world = new Container();

    this.flashOverlay = new Graphics();
    this.particleGfx = new Graphics();
    this.vfxLayer.addChild(this.particleGfx);

    this.root.addChild(this.bgLayer);
    this.root.addChild(this.world);
    this.world.addChild(this.starLayer);
    this.world.addChild(this.entityLayer);
    this.world.addChild(this.projectileLayer);
    this.world.addChild(this.vfxLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.flashOverlay);

    app.stage.addChild(this.root);
  }

  resize(w: number, h: number): void {
    this.initStars(w, h);
    if (!this.nebula) {
      this.nebula = new TilingSprite({
        texture: this.textures.nebula,
        width: w,
        height: h,
      });
      this.bgLayer.addChild(this.nebula);
    } else {
      this.nebula.width = w;
      this.nebula.height = h;
    }

    if (!this.vignette) {
      this.vignette = new Graphics();
      this.bgLayer.addChild(this.vignette);
    }
    this.vignette.clear();
    this.vignette.rect(0, 0, w, h);
    this.vignette.fill({ color: 0x000000, alpha: 0.25 });
  }

  initStars(w: number, h: number): void {
    this.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = i % STAR_LAYERS;
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.5 + layer * 1.2,
        size: 1 + layer * 0.5,
        brightness: 0.3 + layer * 0.25,
        layer,
      });
    }
    this.starFrame = 0;
    this.redrawStars();
  }

  private redrawStars(): void {
    this.starLayer.clear();
    for (let layer = 0; layer < STAR_LAYERS; layer++) {
      for (const star of this.stars) {
        if (star.layer !== layer) continue;
        this.starLayer.circle(star.x, star.y, star.size * 0.5);
      }
      this.starLayer.fill({ color: 0xe2e8f0, alpha: 0.3 + layer * 0.25 });
    }
  }

  getStars(): Star[] {
    return this.stars;
  }

  updateStars(dt: number, h: number, w: number): void {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
    }
    this.starFrame++;
    if (this.starFrame % STAR_REDRAW_INTERVAL === 0) {
      this.redrawStars();
    }
  }

  clearDynamicSprites(): void {
    this.releaseSpriteMap(this.enemySprites, this.entityLayer);
    this.releaseSpriteMap(this.bulletSprites, this.projectileLayer);
    this.releaseSpriteMap(this.powerSprites, this.entityLayer);
    this.releaseSpriteMap(this.collectibleSprites, this.entityLayer);
    for (const [, t] of this.popupTexts) {
      this.uiLayer.removeChild(t);
      t.destroy();
    }
    this.popupTexts.clear();
    if (this.playerSprite) {
      this.entityLayer.removeChild(this.playerSprite);
      this.playerSprite.destroy();
      this.playerSprite = null;
    }
    this.particleGfx.clear();
  }

  private releaseSpriteMap<T>(map: Map<T, Sprite>, layer: Container): void {
    for (const [, spr] of map) {
      layer.removeChild(spr);
      spr.destroy();
    }
    map.clear();
  }

  sync(
    player: PlayerShip,
    enemies: Enemy[],
    bullets: Bullet[],
    powerUps: PowerUp[],
    collectibles: Collectible[],
    popups: RewardPopup[],
    particles: GameParticle[],
    frame: number,
    gameState: string,
  ): void {
    this.vfx.applyShake(this.world);

    if (gameState !== 'playing' && gameState !== 'paused') {
      this.clearDynamicSprites();
      this.drawFlash();
      return;
    }

    const skinTextures = this.textures.player[player.shipSkin];
    const thrusterFrame = Math.floor(player.thrusterFrame / 4) % 2;
    if (!this.playerSprite) {
      this.playerSprite = new Sprite(skinTextures[thrusterFrame]);
      this.playerSprite.anchor.set(0.5);
      this.entityLayer.addChild(this.playerSprite);
    }
    this.playerSprite.texture = skinTextures[thrusterFrame];
    this.playerSprite.x = player.x + player.width / 2;
    this.playerSprite.y = player.y + player.height / 2;
    this.playerSprite.visible =
      player.invincibleTimer <= 0 || Math.floor(frame / 4) % 2 === 0;

    this.syncSprites(enemies, this.enemySprites, this.entityLayer, (e, spr) => {
      spr.texture = this.textures.enemies[e.type];
      spr.x = e.x + e.width / 2;
      spr.y = e.y + e.height / 2;
    }, (e) => new Sprite(this.textures.enemies[e.type]));

    this.syncSprites(bullets, this.bulletSprites, this.projectileLayer, (b, spr) => {
      spr.texture = b.isPlayerBullet ? this.textures.bulletPlayer : this.textures.bulletEnemy;
      spr.x = b.x + b.width / 2;
      spr.y = b.y + b.height / 2;
      if (b.isPlayerBullet) {
        spr.scale.set(1, 1.2);
        spr.alpha = 0.95;
      } else {
        spr.scale.set(1);
        spr.alpha = 1;
      }
    }, (b) => new Sprite(b.isPlayerBullet ? this.textures.bulletPlayer : this.textures.bulletEnemy));

    this.syncSprites(powerUps, this.powerSprites, this.entityLayer, (pu, spr) => {
      const pulse = Math.sin(frame * 0.08) * 0.08;
      spr.x = pu.x + pu.width / 2;
      spr.y = pu.y + pu.height / 2;
      spr.scale.set(1 + pulse);
    }, (pu) => new Sprite(this.textures.powerUps[pu.type]));

    this.syncSprites(collectibles, this.collectibleSprites, this.entityLayer, (c, spr) => {
      spr.x = c.x + c.width / 2;
      spr.y = c.y + c.height / 2;
    }, (c) => {
      const tex =
        c.type === 'coin' ? this.textures.coin : c.type === 'gem' ? this.textures.gem : this.textures.diamond;
      return new Sprite(tex);
    });

    this.syncPopups(popups);
    this.drawParticles(particles);
    this.drawFlash();
  }

  private syncSprites<T>(
    items: T[],
    map: Map<T, Sprite>,
    layer: Container,
    update: (item: T, spr: Sprite) => void,
    create: (item: T) => Sprite,
  ): void {
    const active = new Set(items);
    for (const [item, spr] of map) {
      if (!active.has(item)) {
        layer.removeChild(spr);
        spr.destroy();
        map.delete(item);
      }
    }
    for (const item of items) {
      let spr = map.get(item);
      if (!spr) {
        spr = create(item);
        spr.anchor.set(0.5);
        layer.addChild(spr);
        map.set(item, spr);
      }
      update(item, spr);
    }
  }

  private syncPopups(popups: RewardPopup[]): void {
    const active = new Set(popups);
    for (const [rp, t] of this.popupTexts) {
      if (!active.has(rp)) {
        this.uiLayer.removeChild(t);
        t.destroy();
        this.popupTexts.delete(rp);
      }
    }
    for (const rp of popups) {
      let t = this.popupTexts.get(rp);
      if (!t) {
        t = new Text({
          text: rp.text,
          style: {
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: '600',
            fill: rp.color,
          },
        });
        t.anchor.set(0.5);
        this.uiLayer.addChild(t);
        this.popupTexts.set(rp, t);
      }
      t.text = rp.text;
      t.x = rp.x;
      t.y = rp.y;
      t.alpha = Math.max(0, rp.life / rp.maxLife);
    }
  }

  private drawParticles(particles: GameParticle[]): void {
    this.particleGfx.clear();
    if (particles.length === 0) return;

    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.particleGfx.circle(p.x, p.y, Math.max(0.5, p.size));
      this.particleGfx.fill({ color: p.color, alpha });
    }
  }

  private drawFlash(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.flashOverlay.clear();
    if (this.vfx.flashAlpha > 0) {
      this.flashOverlay.rect(0, 0, w, h);
      this.flashOverlay.fill({ color: 0xb84a4a, alpha: this.vfx.flashAlpha });
    }
  }

  destroy(): void {
    this.clearDynamicSprites();
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }
}
