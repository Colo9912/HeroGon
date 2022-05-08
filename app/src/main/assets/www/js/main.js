class SpaceScene extends Phaser.Scene
{
    constructor() {
        super();
        this.phaseConfig;

        this.hero;
        this.heroLaser;
        this.villain;
        this.villainLaser;
        this.gameOver = false;

        this.heroLifesLength;
        this.villainLifesLength;
        this.heroLifeStatus = 1;
        this.villainLifeStatus = 1;

        this.gameOverMessage;
        this.wonMessage;
        this.restartButton;
    }

    shootHeroLaser() {
        if (this.heroLaser.y < this.villain.y) {
            this.heroLaser.body.reset(this.hero.x, this.hero.y - 20);
            this.heroLaser.setVisible(true);
            this.heroLaser.setVelocityY(-900);
        }
    }

    shootVillainLaser() {
        if (this.villainLaser.y > this.hero.y) {
            this.villainLaser.body.reset(this.villain.x, this.villain.y - 20);
            this.villainLaser.setVisible(true);
            this.villainLaser.setVelocityY(900);
        }
    }

    hitHero() {
        if (this.heroLifeStatus == 1) {
            this.heroLifeStatus = 0;
            this.heroLifesLength --;
            this.heroLifes[this.heroLifesLength].setVisible(false);
            if (this.heroLifesLength == 0) {
                this.gameOver = true;
                this.physics.pause();
                this.gameOverMessage.setVisible(true);
                this.restartButton.setVisible(true);
            } else {
                this.time.addEvent({
                    delay: 2000,
                    callback: this.resurrectHero,
                    callbackScope: this,
                    loop: false
                });
            }
        }
    }

    hitVillain() {
        if (this.villainLifeStatus == 1) {
            this.villainLifeStatus = 0;
            this.villainLifesLength --;
            this.villainLifes[this.villainLifesLength].setVisible(false);
            if (this.villainLifesLength == 0) {
                if (this.phaseConfig.id < numPhases) {
                    this.resetScene();
                    this.scene.stop();
                    this.scene.start('phase_' + (this.phaseConfig.id + 1));
                } else {
                    this.gameOver = true;
                    this.physics.pause();
                    this.wonMessage.setVisible(true);
                    this.restartButton.setVisible(true);
                }
            } else {
                this.time.addEvent({
                    delay: 2000,
                    callback: this.resurrectVillain,
                    callbackScope: this,
                    loop: false
                });
            }
        }
    }

    resurrectHero() {
        var camera = this.cameras.main;
        this.hero.setVelocityY(0);
        this.hero.x = camera.width / 2;
        this.hero.y = camera.height - 90;
        this.heroLifeStatus = 1;
    }

    resurrectVillain() {
        var camera = this.cameras.main;
        this.villain.setVelocityY(0);
        this.villain.setVelocityX(400);
        this.villain.x = camera.width / 2;
        this.villain.y = 90;
        this.villainLifeStatus = 1;
    }

    resetScene() {
        this.villainLifeStatus = 1;
        this.heroLifeStatus = 1;
        this.villainLifesLength = this.villainLifes.length;
        this.heroLifesLength = this.heroLifes.length;
        for (var i = 0; i < this.villainLifesLength; i++) {
            this.villainLifes[i].setVisible(true);
        }
        for (var i = 0; i < this.heroLifesLength; i++) {
            this.heroLifes[i].setVisible(true);
        }
        this.gameOver = false;
        this.gameOverMessage.setVisible(false);
        this.wonMessage.setVisible(false);
        this.restartButton.setVisible(false);
    }

    restartGame() {
        this.resetScene();
        this.scene.stop();
        this.scene.start('phase_1');
        this.physics.resume();
    }

    init(phaseConfig) {
        this.phaseConfig = phaseConfig; 
    }

    preload() {
        this.load.spritesheet('img_' + this.phaseConfig.id + '_hero', this.phaseConfig.heroImage, { frameWidth: 99, frameHeight: 75});
        this.load.image('img_' + this.phaseConfig.id + '_villain', this.phaseConfig.villainImage);
        this.load.image('heroLaser', './img/heroLaser.png');
        this.load.image('villainLaser', './img/villainLaser.png');
        this.load.image('heroLife', './img/life.png');
        this.load.image('villainLife', './img/life.png');
        this.load.image('restartButton', './img/restart.png');
    }

    create() {
        var camera = this.cameras.main;
        camera.setBackgroundColor(0x555555);

        this.physics.world.checkCollision.up = false;
        this.physics.world.checkCollision.down = false;

        this.heroFrame = 0;
        this.hero = this.physics.add.sprite(camera.width / 2, camera.height - 90, 'img_' + this.phaseConfig.id + '_hero', this.heroFrame);
        this.villain = this.physics.add.image(camera.width / 2, 90, 'img_' + this.phaseConfig.id + '_villain');
        this.villain.setCollideWorldBounds(true);
        this.villain.setBounce(1);
        this.villain.setVelocityX(400);
        this.heroLaser = this.physics.add.image(camera.width / 2, 0, 'heroLaser');
        this.heroLaser.setVisible(false);
        this.villainLaser = this.physics.add.image(camera.width / 2, camera.height, 'villainLaser');
        this.villainLaser.setVisible(false);

        this.heroLifes = [];
        for (var i = 0; i < this.phaseConfig.heroLifes; i++) {
            this.heroLifes[i] = this.add.image(16 + i*32, camera.height - 16, 'heroLife');
        }
        this.heroLifesLength = this.phaseConfig.heroLifes;
        this.villainLifes = [];
        for (var i = 0; i < this.phaseConfig.villainLifes; i++) {
            this.villainLifes[i] = this.add.image(16 + i*32, 16, 'villainLife');
        }
        this.villainLifesLength = this.phaseConfig.villainLifes;

        this.physics.add.collider(this.villain, this.heroLaser, this.hitVillain, null, this);
        this.physics.add.collider(this.hero, this.villainLaser, this.hitHero, null, this);

        this.input.on('pointermove', pointer => {
            if (this.gameOver) return;
            this.hero.x = pointer.x;
        });
        this.input.on('pointerdown', pointer => {
            if (this.gameOver) return;
            this.shootHeroLaser();
        });
        var shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        shootKey.on('down', event => {
            if (this.gameOver) return;
            this.shootHeroLaser();
        });
        var skinChangeLeftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        skinChangeLeftKey.on('down', event => {
            if (this.gameOver) return;
            this.heroFrame = (this.heroFrame - 1 + this.phaseConfig.heroSkins) % this.phaseConfig.heroSkins;
            this.hero.setFrame(this.heroFrame);
        });
        var skinChangeRightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        skinChangeRightKey.on('down', event => {
            if (this.gameOver) return;
            this.heroFrame = (this.heroFrame + 1) % this.phaseConfig.heroSkins;
            this.hero.setFrame(this.heroFrame);
        });

        this.time.addEvent({
            delay: 1000,
            callback: this.shootVillainLaser,
            callbackScope: this,
            loop: true
        });

        this.gameOverMessage = this.add.text(camera.width / 2 - 45, camera.height / 2 - 60, "Game Over!");
        this.gameOverMessage.setVisible(false);
        this.wonMessage = this.add.text(camera.width / 2 - 40, camera.height / 2 - 60, "You won!");
        this.wonMessage.setVisible(false);
        this.restartButton = this.add.image(camera.width / 2, camera.height / 2, 'restartButton');
        this.restartButton.setInteractive();
        this.restartButton.on('pointerdown', this.restartGame, this);
        this.restartButton.setVisible(false);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
};

let game = new Phaser.Game(config);
let numPhases = 1;
game.scene.add('phase_' + numPhases, SpaceScene, true, {
    id: numPhases,
    heroImage: './img/heros/spiderman.png',
    villainImage:  './img/villains/sandman.png',
    heroLifes: 2,
    villainLifes: 2,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/mistica.png',
    villainImage:  './img/villains/dr_octopus.png',
    heroLifes: 3,
    villainLifes: 3,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/volverine.png',
    villainImage:  './img/villains/dr_doom.png',
    heroLifes: 5,
    villainLifes: 5,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/storm.png',
    villainImage:  './img/villains/centinela.png',
    heroLifes: 6,
    villainLifes: 6,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/iron_man.png',
    villainImage:  './img/villains/ultron.png',
    heroLifes: 7,
    villainLifes: 7,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/pantera_negra.png',
    villainImage:  './img/villains/luky.png',
    heroLifes: 8,
    villainLifes: 8,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/she_hulk.png',
    villainImage:  './img/villains/venom.png',
    heroLifes: 9,
    villainLifes: 9,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/thor.png',
    villainImage:  './img/villains/hela.png',
    heroLifes: 10,
    villainLifes: 10,
    heroSkins: 1,
});
numPhases ++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/capitana_marvel.png',
    villainImage:  './img/villains/thanos.png',
    heroLifes: 12,
    villainLifes: 12,
    heroSkins: 1,
});
numPhases++;
game.scene.add('phase_' + numPhases, SpaceScene, false, {
    id: numPhases,
    heroImage: './img/heros/all.png',
    villainImage:  './img/villains/galactus.png',
    heroLifes: 14,
    villainLifes: 14,
    heroSkins: 9,
});
