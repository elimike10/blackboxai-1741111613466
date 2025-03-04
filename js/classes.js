class Companion {
    constructor(player, type) {
        this.player = player;
        this.type = type;
        this.x = player.x;
        this.y = player.y;
        this.angle = 0;
        this.distance = 50;
        this.lastShot = 0;
        this.lastHeal = 0;
    }

    update() {
        this.angle += 0.02;
        this.x = this.player.x + Math.cos(this.angle) * this.distance;
        this.y = this.player.y + Math.sin(this.angle) * this.distance;

        switch(this.type) {
            case COMPANION_TYPES.DRONE:
                this.updateCombatDrone();
                break;
            case COMPANION_TYPES.SHIELD:
                this.updateShieldDrone();
                break;
            case COMPANION_TYPES.HEALER:
                this.updateHealerDrone();
                break;
        }
    }

    updateCombatDrone() {
        const now = Date.now();
        if (now - this.lastShot >= this.type.fireRate) {
            const nearestEnemy = this.findNearestEnemy();
            if (nearestEnemy && this.getDistance(nearestEnemy) <= this.type.range) {
                const angle = Math.atan2(
                    nearestEnemy.y - this.y,
                    nearestEnemy.x - this.x
                );
                game.bullets.push(new Bullet(this.x, this.y, angle + Math.PI/2));
                this.lastShot = now;
            }
        }
    }

    updateShieldDrone() {
        game.ctx.save();
        game.ctx.beginPath();
        game.ctx.arc(this.x, this.y, this.type.radius, 0, Math.PI * 2);
        game.ctx.strokeStyle = `${this.type.color}44`;
        game.ctx.lineWidth = 2;
        game.ctx.stroke();
        game.ctx.restore();

        game.enemyBullets = game.enemyBullets.filter(bullet => {
            const distance = this.getDistance(bullet);
            if (distance <= this.type.radius && Math.random() < this.type.blockChance) {
                this.createBlockEffect(bullet.x, bullet.y);
                return false;
            }
            return true;
        });
    }

    updateHealerDrone() {
        const now = Date.now();
        if (now - this.lastHeal >= this.type.healInterval && game.player.health < 100) {
            game.player.health = Math.min(100, game.player.health + this.type.healAmount);
            this.createHealEffect();
            this.lastHeal = now;
        }
    }

    getDistance(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findNearestEnemy() {
        return game.enemies.reduce((nearest, enemy) => {
            const distance = this.getDistance(enemy);
            if (!nearest || distance < this.getDistance(nearest)) {
                return enemy;
            }
            return nearest;
        }, null);
    }

    createBlockEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const particle = new Particle(x, y, this.type.color);
            particle.speedX = Math.cos(angle) * 3;
            particle.speedY = Math.sin(angle) * 3;
            game.particles.push(particle);
        }
    }

    createHealEffect() {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const particle = new Particle(this.x, this.y, this.type.color);
            particle.speedX = Math.cos(angle) * 2;
            particle.speedY = Math.sin(angle) * 2;
            game.particles.push(particle);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.type.color;
        ctx.fill();
        
        ctx.restore();
    }
}

class BossEnemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.type = type;
        this.health = type.health;
        this.maxHealth = type.health;
        this.speed = 2;
        this.pattern = 0;
        this.patternTime = 0;
        this.teleportCooldown = 0;
        this.clones = [];
    }

    update() {
        if (this.y < 100) {
            this.y += this.speed;
        }

        this.patternTime++;
        if (this.patternTime > 120) {
            this.pattern = (this.pattern + 1) % this.type.patterns.length;
            this.patternTime = 0;
        }

        const pattern = this.type.patterns[this.pattern];
        switch(pattern) {
            case 'crossfire':
                if (this.patternTime % 10 === 0) {
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i + (this.patternTime * 0.1);
                        game.enemyBullets.push(new EnemyBullet(
                            this.x + this.width/2,
                            this.y + this.height/2,
                            angle,
                            this.type.color
                        ));
                    }
                }
                break;
            case 'spiral':
                if (this.patternTime % 5 === 0) {
                    const angle = this.patternTime * 0.2;
                    game.enemyBullets.push(new EnemyBullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        angle,
                        this.type.color
                    ));
                }
                break;
            case 'laser':
                if (this.patternTime === 60) {
                    const angle = Math.atan2(
                        game.player.y - this.y,
                        game.player.x - this.x
                    );
                    this.shootLaserBeam(angle);
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw health bar
        const healthBarWidth = this.width;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y - 10, healthBarWidth * healthPercentage, healthBarHeight);

        ctx.restore();
    }

    shootLaserBeam(angle) {
        const beam = {
            x: this.x + this.width/2,
            y: this.y + this.height/2,
            angle: angle,
            width: 1000,
            thickness: 5
        };

        const drawBeam = () => {
            game.ctx.save();
            game.ctx.translate(beam.x, beam.y);
            game.ctx.rotate(angle);
            
            game.ctx.fillStyle = this.type.color;
            game.ctx.fillRect(0, -beam.thickness/2, beam.width, beam.thickness);
            
            game.ctx.globalAlpha = 0.5;
            game.ctx.fillRect(0, -beam.thickness, beam.width, beam.thickness * 2);
            
            game.ctx.restore();

            const playerAngle = Math.atan2(game.player.y - beam.y, game.player.x - beam.x);
            const angleDiff = Math.abs(playerAngle - angle);
            if (angleDiff < 0.1) {
                game.player.health -= 5;
            }
        };

        let duration = 60;
        const animateBeam = () => {
            if (duration > 0) {
                drawBeam();
                duration--;
                requestAnimationFrame(animateBeam);
            }
        };
        animateBeam();
    }
}
