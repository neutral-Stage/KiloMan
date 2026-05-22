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
import { STAR_COUNT, STAR_LAYERS } from '../constants';
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
  private flashOverlay: Graphics;
  private stars: Star[] = [];

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
    if (this.nebula) {
      this.nebula.width = w;
      this.nebula.height = h;
    } else {
      this.nebula = new TilingSprite({
        texture: this.textures.nebula,
        width: w,
        height: h,
      });
      this.bgLayer.addChild(this.nebula);
    }
    const vig = new Graphics();
    vig.rect(0, 0, w, h);
    vig.fill({ color: 0x000000, alpha: 0.25 });
    this.bgLayer.removeChildren();
    this.bgLayer.addChild(this.nebula);
    this.bgLayer.addChild(vig);
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
      });
    }
    this.redrawStars();
  }

  private redrawStars(): void {
    this.starLayer.clear();
    for (const star of this.stars) {
      this.starLayer.circle(star.x, star.y, star.size * 0.5);
      this.starLayer.fill({ color: 0xe2e8f0, alpha: star.brightness });
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
    this.redrawStars();
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
      this.entityLayer.removeChildren();
      this.projectileLayer.removeChildren();
      this.vfxLayer.removeChildren();
      this.enemySprites.clear();
      this.bulletSprites.clear();
      this.powerSprites.clear();
      this.collectibleSprites.clear();
      this.popupTexts.clear();
      this.playerSprite = null;
      this.drawFlash();
      return;
    }

    // Player
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

    // Enemies
    const activeEnemies = new Set(enemies);
    for (const [e, spr] of this.enemySprites) {
      if (!activeEnemies.has(e)) {
        this.entityLayer.removeChild(spr);
        this.enemySprites.delete(e);
      }
    }
    for (const e of enemies) {
      let spr = this.enemySprites.get(e);
      if (!spr) {
        spr = new Sprite(this.textures.enemies[e.type]);
        spr.anchor.set(0.5);
        this.entityLayer.addChild(spr);
        this.enemySprites.set(e, spr);
      }
      spr.x = e.x + e.width / 2;
      spr.y = e.y + e.height / 2;
    }

    // Bullets
    const activeBullets = new Set(bullets);
    for (const [b, spr] of this.bulletSprites) {
      if (!activeBullets.has(b)) {
        this.projectileLayer.removeChild(spr);
        this.bulletSprites.delete(b);
      }
    }
    for (const b of bullets) {
      let spr = this.bulletSprites.get(b);
      if (!spr) {
        spr = new Sprite(b.isPlayerBullet ? this.textures.bulletPlayer : this.textures.bulletEnemy);
        spr.anchor.set(0.5);
        this.projectileLayer.addChild(spr);
        this.bulletSprites.set(b, spr);
      }
      spr.x = b.x + b.width / 2;
      spr.y = b.y + b.height / 2;
      if (b.isPlayerBullet) {
        spr.scale.set(1, 1.2);
        spr.alpha = 0.95;
      }
    }

    // Power-ups
    const activePu = new Set(powerUps);
    for (const [pu, spr] of this.powerSprites) {
      if (!activePu.has(pu)) {
        this.entityLayer.removeChild(spr);
        this.powerSprites.delete(pu);
      }
    }
    for (const pu of powerUps) {
      let spr = this.powerSprites.get(pu);
      if (!spr) {
        spr = new Sprite(this.textures.powerUps[pu.type]);
        spr.anchor.set(0.5);
        this.entityLayer.addChild(spr);
        this.powerSprites.set(pu, spr);
      }
      const pulse = Math.sin(frame * 0.08) * 0.08;
      spr.x = pu.x + pu.width / 2;
      spr.y = pu.y + pu.height / 2;
      spr.scale.set(1 + pulse);
    }

    // Collectibles
    const activeCol = new Set(collectibles);
    for (const [c, spr] of this.collectibleSprites) {
      if (!activeCol.has(c)) {
        this.entityLayer.removeChild(spr);
        this.collectibleSprites.delete(c);
      }
    }
    for (const c of collectibles) {
      let spr = this.collectibleSprites.get(c);
      if (!spr) {
        const tex =
          c.type === 'coin'
            ? this.textures.coin
            : c.type === 'gem'
              ? this.textures.gem
              : this.textures.diamond;
        spr = new Sprite(tex);
        spr.anchor.set(0.5);
        this.entityLayer.addChild(spr);
        this.collectibleSprites.set(c, spr);
      }
      spr.x = c.x + c.width / 2;
      spr.y = c.y + c.height / 2;
    }

    // Popups
    const activePop = new Set(popups);
    for (const [rp, t] of this.popupTexts) {
      if (!activePop.has(rp)) {
        this.uiLayer.removeChild(t);
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
      t.x = rp.x;
      t.y = rp.y;
      t.alpha = Math.max(0, rp.life / rp.maxLife);
    }

    // Particles
    this.vfxLayer.removeChildren();
    this.particleGfx.clear();
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.particleGfx.circle(p.x, p.y, Math.max(0.5, p.size));
      this.particleGfx.fill({ color: p.color, alpha });
    }
    this.vfxLayer.addChild(this.particleGfx);

    this.drawFlash();
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
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }
}
