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
                game.bullets.push(new Bullet(this.x, this.y, angle));
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

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.health = 100;
        this.keys = {};
        
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    update() {
        if (this.keys['ArrowLeft'] || this.keys['a']) this.x -= this.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.x += this.speed;
        if (this.keys['ArrowUp'] || this.keys['w']) this.y -= this.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) this.y += this.speed;

        this.x = Math.max(0, Math.min(this.x, CANVAS_WIDTH - this.width));
        this.y = Math.max(0, Math.min(this.y, CANVAS_HEIGHT - this.height));
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.health = 50;
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class BossEnemy extends Enemy {
    constructor(x, y, type) {
        super(x, y);
        this.width = 60;
        this.height = 60;
        this.type = type;
        this.health = type.health;
        this.maxHealth = type.health;
        this.pattern = 0;
        this.patternTime = 0;
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
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Health bar
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 10, this.width * healthPercentage, 5);
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.speed = 7;
        this.angle = angle;
    }

    update() {
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }
}
