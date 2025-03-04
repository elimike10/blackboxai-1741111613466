// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 2;
const SPAWN_INTERVAL = 2000;
const BOSS_SPAWN_SCORE = 100; // Spawn boss every 100 points
const ULTIMATE_CHARGE_RATE = 0.5; // Ultimate ability charge rate
const ULTIMATE_MAX = 100; // Maximum ultimate charge

// Weapon types and their properties
const ELEMENTS = {
    FIRE: { color: '#ff4400', effect: 'burn', duration: 3000 },
    ICE: { color: '#00ffff', effect: 'freeze', duration: 2000 },
    LIGHTNING: { color: '#ffff00', effect: 'chain', chainCount: 3 },
    VOID: { color: '#ff00ff', effect: 'implode', radius: 50 }
};

const WEAPONS = {
    LASER: {
        name: 'Laser',
        color: '#fff',
        damage: 25,
        speed: 7,
        size: { width: 5, height: 10 },
        element: null
    },
    PLASMA: {
        name: 'Plasma',
        color: '#0ff',
        damage: 40,
        speed: 5,
        size: { width: 8, height: 8 },
        element: null
    },
    MISSILE: {
        name: 'Missile',
        color: '#f00',
        damage: 60,
        speed: 4,
        size: { width: 6, height: 12 },
        tracking: true,
        element: null
    }
};

const SKILL_TREE = {
    WEAPONS: {
        LASER_MASTERY: { cost: 3, effect: 'Laser damage +50%' },
        PLASMA_MASTERY: { cost: 3, effect: 'Plasma damage +50%' },
        MISSILE_MASTERY: { cost: 3, effect: 'Missile damage +50%' },
        DUAL_SHOT: { cost: 5, effect: 'Fire two projectiles' },
        RAPID_FIRE: { cost: 4, effect: 'Increase fire rate by 30%' }
    },
    ELEMENTS: {
        FIRE_MASTERY: { cost: 3, effect: 'Fire damage +30%' },
        ICE_MASTERY: { cost: 3, effect: 'Freeze duration +50%' },
        LIGHTNING_MASTERY: { cost: 3, effect: 'Chain to additional target' },
        VOID_MASTERY: { cost: 3, effect: 'Implode radius +30%' },
        ELEMENTAL_HARMONY: { cost: 5, effect: 'Combine two elements' }
    },
    ABILITIES: {
        TIME_MASTER: { cost: 4, effect: 'Time Stop duration +50%' },
        GRAVITY_WELL: { cost: 4, effect: 'Black Hole radius +50%' },
        SHIELD_MASTER: { cost: 4, effect: 'Shield reflects projectiles' },
        ULTIMATE_POWER: { cost: 5, effect: 'Ultimate charges 50% faster' }
    }
};

// Special abilities
const ABILITIES = {
    TIMESTOP: {
        name: 'Time Stop',
        duration: 3000,
        cooldown: 15000
    },
    BLACKHOLE: {
        name: 'Black Hole',
        duration: 5000,
        cooldown: 20000
    },
    SHIELD: {
        name: 'Energy Shield',
        duration: 4000,
        cooldown: 12000
    }
};

class Game {
    constructor() {
        // Initialize canvas and context first
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Weapon and element system
        this.currentWeapon = WEAPONS.LASER;
        this.currentElement = null;
        this.weaponLevel = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.skillPoints = 0;
        this.unlockedSkills = new Set();
        
        // Special abilities
        this.abilities = {
            timestop: { ready: true, lastUsed: 0 },
            blackhole: { ready: true, lastUsed: 0 },
            shield: { ready: true, lastUsed: 0 }
        };
        this.timeStopActive = false;
        this.blackHoleActive = false;
        this.blackHolePosition = null;
        
        // Ultimate ability
        this.ultimateCharge = 0;
        this.isUltimateActive = false;
        
        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        
        // Achievement system
        this.achievements = {
            firstKill: { earned: false, name: "First Blood", description: "Destroy your first enemy" },
            combo10: { earned: false, name: "Combo Master", description: "Reach a 10x combo" },
            boss: { earned: false, name: "Boss Slayer", description: "Defeat a boss" },
            ultimate: { earned: false, name: "Ultimate Power", description: "Use your ultimate ability" }
        };
        
        // Sound effects
        this.sounds = {
            shoot: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='),
            explosion: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='),
            powerup: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==')
        };
        
        // Initialize oscillators for sound effects
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.setupSoundEffects();
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        // Initialize enhanced stars with more variety
        this.stars = Array(200).fill().map(() => {
            const speed = Math.random() * 0.5 + 0.1;
            return {
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                speed: speed,
                parallaxSpeed: (Math.random() - 0.5) * 0.3, // Horizontal movement
                size: Math.random() * 3 + 1,
                color: speed > 0.3 ? '#ffffff' : 
                       speed > 0.2 ? '#00ffff' : 
                       speed > 0.1 ? '#ff00ff' : '#ffd700',
                twinkle: Math.random() * Math.PI,
                shape: Math.random() > 0.7 ? 'diamond' : 'circle' // 30% diamonds, 70% circles
            };
        });
        
        // Add power-ups system
        this.powerUps = [];
        this.lastPowerUpTime = 0;
        this.powerUpInterval = 10000; // Power-up every 10 seconds
        
        this.score = 0;
        this.health = 100;
        this.gameLoop = null;
        this.lastSpawnTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        
        this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        
        this.setupEventListeners();
        this.updateUI();
    }

    drawBackground() {
        const time = Date.now() / 3000;
        
        // Create base nebula background with radial gradient
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const baseGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, CANVAS_HEIGHT
        );
        baseGradient.addColorStop(0, '#2a0033');
        baseGradient.addColorStop(0.3, '#000066');
        baseGradient.addColorStop(0.6, '#330066');
        baseGradient.addColorStop(1, '#000033');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw animated nebula clouds
        const cloudColors = [
            ['rgba(255, 0, 255, 0.03)', 'rgba(75, 0, 130, 0.05)'],  // Purple nebula
            ['rgba(0, 255, 255, 0.03)', 'rgba(0, 0, 255, 0.05)'],   // Blue nebula
            ['rgba(255, 150, 0, 0.03)', 'rgba(255, 0, 0, 0.05)']    // Orange nebula
        ];

        cloudColors.forEach((colors, index) => {
            const offset = time + index * Math.PI / 2;
            const x = centerX + Math.sin(offset) * 100;
            const y = centerY + Math.cos(offset) * 100;
            const cloudGradient = this.ctx.createRadialGradient(
                x, y, 0,
                x, y, CANVAS_HEIGHT / 1.5
            );
            cloudGradient.addColorStop(0, colors[0]);
            cloudGradient.addColorStop(1, colors[1]);
            this.ctx.fillStyle = cloudGradient;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        });

        // Add subtle pulsing glow at random positions
        for (let i = 0; i < 3; i++) {
            const glowX = centerX + Math.sin(time * (i + 1)) * 200;
            const glowY = centerY + Math.cos(time * (i + 1)) * 200;
            const glowGradient = this.ctx.createRadialGradient(
                glowX, glowY, 0,
                glowX, glowY, 100
            );
            const alpha = (Math.sin(time * 2 + i) + 1) * 0.03;
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            glowGradient.addColorStop(0.5, `rgba(100, 100, 255, ${alpha / 2})`);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }

    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    pause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseScreen').style.display = this.isPaused ? 'flex' : 'none';
    }

    gameOver() {
        this.isGameOver = true;
        cancelAnimationFrame(this.gameLoop);
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
    }

    restart() {
        this.score = 0;
        this.health = 100;
        this.isGameOver = false;
        this.isPaused = false;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
        document.getElementById('gameOverScreen').style.display = 'none';
        this.gameLoop = requestAnimationFrame(() => this.update());
        this.updateUI();
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // Update ability cooldowns
        const now = Date.now();
        Object.entries(this.abilities).forEach(([ability, data]) => {
            if (!data.ready) {
                const cooldown = ABILITIES[ability.toUpperCase()].cooldown;
                const progress = Math.min(100, ((now - data.lastUsed) / cooldown) * 100);
                document.getElementById(`${ability}Cooldown`).style.width = `${progress}%`;
                if (now - data.lastUsed >= cooldown) {
                    data.ready = true;
                }
            }
        });

        // Black hole effect
        if (this.blackHoleActive && this.blackHolePosition) {
            this.enemies.forEach(enemy => {
                const dx = this.blackHolePosition.x - (enemy.x + enemy.width/2);
                const dy = this.blackHolePosition.y - (enemy.y + enemy.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 200) {
                    enemy.x += dx * 0.1;
                    enemy.y += dy * 0.1;
                }
            });
        }

        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= 16; // Assuming 60fps
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.updateUI();
            }
        }

        // Charge ultimate ability
        if (this.ultimateCharge < ULTIMATE_MAX && !this.isUltimateActive) {
            this.ultimateCharge += ULTIMATE_CHARGE_RATE;
            this.updateUI();
        }

        // Draw enhanced space background
        this.drawBackground();

        // Draw cosmic dust and energy waves
        this.ctx.globalAlpha = 0.1;
        const currentTime = Date.now() / 3000;
        for (let i = 0; i < 5; i++) {
            const waveTime = currentTime + i;
            // Create flowing cosmic dust
            const dustGradient = this.ctx.createRadialGradient(
                CANVAS_WIDTH * (0.2 + 0.2 * i + Math.sin(waveTime) * 0.1),
                CANVAS_HEIGHT * (0.2 + 0.15 * i + Math.cos(waveTime) * 0.1),
                0,
                CANVAS_WIDTH * (0.2 + 0.2 * i + Math.sin(waveTime) * 0.1),
                CANVAS_HEIGHT * (0.2 + 0.15 * i + Math.cos(waveTime) * 0.1),
                200 + Math.sin(waveTime * 0.5) * 50
            );
            
            // Different colors for each dust cloud
            const colors = [
                ['#ff00ff40', '#4b008280'], // Purple
                ['#00ffff40', '#0080ff80'], // Cyan
                ['#ff8c0040', '#ff400080'], // Orange
                ['#00ff8040', '#00408080'], // Green
                ['#ff00ff40', '#8000ff80']  // Magenta
            ];
            
            dustGradient.addColorStop(0, colors[i][0]);
            dustGradient.addColorStop(0.5, colors[i][1]);
            dustGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = dustGradient;
            this.ctx.beginPath();
            this.ctx.arc(
                CANVAS_WIDTH * (0.2 + 0.2 * i + Math.sin(waveTime) * 0.1),
                CANVAS_HEIGHT * (0.2 + 0.15 * i + Math.cos(waveTime) * 0.1),
                200 + Math.sin(waveTime * 0.5) * 50,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }

        // Draw energy waves
        this.ctx.globalAlpha = 0.05;
        for (let i = 0; i < 3; i++) {
            const waveOffset = currentTime * (1 + i * 0.5);
            this.ctx.beginPath();
            this.ctx.moveTo(0, CANVAS_HEIGHT * 0.5);
            
            for (let x = 0; x < CANVAS_WIDTH; x += 5) {
                const y = CANVAS_HEIGHT * 0.5 + 
                         Math.sin(x * 0.01 + waveOffset) * 50 +
                         Math.cos(x * 0.02 - waveOffset) * 30;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.strokeStyle = i === 0 ? '#ff00ff' : i === 1 ? '#00ffff' : '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
        
        // Draw enhanced starfield with parallax effect
        this.ctx.globalAlpha = 1;
        this.stars.forEach(star => {
            star.y += star.speed;
            star.x += star.parallaxSpeed;
            
            if (star.y > CANVAS_HEIGHT || star.x > CANVAS_WIDTH) {
                star.y = star.y > CANVAS_HEIGHT ? 0 : star.y;
                star.x = star.x > CANVAS_WIDTH ? 0 : star.x;
                // Randomize star properties when recycling
                star.color = star.speed > 0.3 ? '#ffffff' : 
                           star.speed > 0.2 ? '#00ffff' : 
                           star.speed > 0.1 ? '#ff00ff' : '#ffd700';
                star.twinkle = Math.random() * Math.PI;
            }
            
            // Enhanced twinkle effect
            const twinkleOpacity = 0.4 + Math.sin(star.twinkle + Date.now() / 500) * 0.3;
            star.twinkle += 0.05;
            
            // Draw star with enhanced glow effect
            const glow = star.size * 2;
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, glow
            );
            gradient.addColorStop(0, star.color);
            gradient.addColorStop(0.4, star.color + '80');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = twinkleOpacity;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, glow, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw star core with shape variation
            this.ctx.fillStyle = star.color;
            this.ctx.globalAlpha = 1;
            if (star.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Draw diamond shape for some stars
                this.ctx.save();
                this.ctx.translate(star.x, star.y);
                this.ctx.rotate(Date.now() / 1000);
                this.ctx.beginPath();
                this.ctx.moveTo(0, -star.size);
                this.ctx.lineTo(star.size, 0);
                this.ctx.lineTo(0, star.size);
                this.ctx.lineTo(-star.size, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }
        });
        
        // Randomly create shooting stars
        if (Math.random() < 0.005) { // 0.5% chance each frame
            const shootingStar = {
                x: Math.random() * CANVAS_WIDTH,
                y: 0,
                length: 20 + Math.random() * 20,
                speed: 15 + Math.random() * 10,
                angle: Math.PI / 4 + Math.random() * 0.2
            };
            
            this.ctx.save();
            this.ctx.translate(shootingStar.x, shootingStar.y);
            this.ctx.rotate(shootingStar.angle);
            
            const gradient = this.ctx.createLinearGradient(0, 0, shootingStar.length, 0);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, shootingStar.length, 1);
            this.ctx.restore();
        }

        // Spawn power-ups
        if (Date.now() - this.lastPowerUpTime > this.powerUpInterval) {
            const types = ['health', 'speed', 'spread'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = Math.random() * (CANVAS_WIDTH - 20);
            this.powerUps.push(new PowerUp(x, -20, type));
            this.lastPowerUpTime = Date.now();
        }

        // Update and draw power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            powerUp.draw(this.ctx);

            // Check collision with player
            if (this.checkCollision(this.player, powerUp)) {
                switch(powerUp.type) {
                    case 'health':
                        this.health = Math.min(100, this.health + 30);
                        break;
                    case 'speed':
                        this.player.speed = 8;
                        setTimeout(() => this.player.speed = PLAYER_SPEED, 5000);
                        break;
                    case 'spread':
                        this.player.spreadShot = true;
                        setTimeout(() => this.player.spreadShot = false, 5000);
                        break;
                }
                this.createPowerUpEffect(powerUp.x, powerUp.y, powerUp.type);
                this.updateUI();
                return false;
            }

            return powerUp.y < CANVAS_HEIGHT;
        });

        // Spawn enemies
        if (Date.now() - this.lastSpawnTime > SPAWN_INTERVAL) {
            this.spawnEnemy();
            this.lastSpawnTime = Date.now();
        }

        // Update and draw player
        this.player.update();
        this.player.draw(this.ctx);

        // Update and draw bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            bullet.draw(this.ctx);
            return bullet.y > 0 && bullet.x > 0 && bullet.x < CANVAS_WIDTH;
        });

        // Update and draw enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            enemy.draw(this.ctx);

            // Check collision with bullets
            this.bullets.forEach((bullet, bulletIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    enemy.health -= 25;
                    this.createExplosion(enemy.x, enemy.y);
                    if (enemy.health <= 0) {
                        // Increase score based on combo
                        const baseScore = enemy instanceof BossEnemy ? 50 : 10;
                        const comboMultiplier = Math.max(1, this.combo);
                        this.score += baseScore * comboMultiplier;
                        
                        // Gain experience
                        this.gainExperience(enemy instanceof BossEnemy ? 50 : 10);
                        
                        // Update combo
                        this.combo++;
                        this.comboTimer = 2000; // 2 seconds to maintain combo
                        this.maxCombo = Math.max(this.maxCombo, this.combo);
                        
                        // Check achievements
                        this.checkAchievements();
                        
                        this.updateUI();
                        return false;
                    }
                }
            });

            // Check collision with player
            if (this.checkCollision(this.player, enemy)) {
                this.health -= 20;
                this.createExplosion(enemy.x, enemy.y);
                this.updateUI();
                if (this.health <= 0) {
                    this.gameOver();
                }
                return false;
            }

            return enemy.y < CANVAS_HEIGHT;
        });

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return particle.alpha > 0;
        });

        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    spawnEnemy() {
        if (this.score > 0 && this.score % BOSS_SPAWN_SCORE === 0 && !this.enemies.some(e => e instanceof BossEnemy)) {
            this.enemies.push(new BossEnemy(CANVAS_WIDTH / 2, -50));
        } else {
            const x = Math.random() * (CANVAS_WIDTH - 30);
            this.enemies.push(new Enemy(x, -30));
        }
    }

    setupSoundEffects() {
        // Laser sound
        this.sounds.shoot.addEventListener('play', () => {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + 0.2);
        });

        // Explosion sound
        this.sounds.explosion.addEventListener('play', () => {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, this.audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + 0.5);
        });

        // Power-up sound
        this.sounds.powerup.addEventListener('play', () => {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + 0.1);
        });
    }

    createExplosion(x, y, size = 20) {
        const colors = ['#ff0000', '#ff7700', '#ffff00'];
        for (let i = 0; i < size; i++) {
            this.particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
        }
        this.sounds.explosion.play().catch(() => {});
        
        // Screen shake effect
        const intensity = size / 20;
        this.canvas.style.transform = `translate(${Math.random() * 10 * intensity - 5 * intensity}px, ${Math.random() * 10 * intensity - 5 * intensity}px)`;
        setTimeout(() => this.canvas.style.transform = 'translate(0, 0)', 50);
    }

    createPowerUpEffect(x, y, type) {
        const colors = {
            health: ['#00ff00', '#ffffff'],
            speed: ['#00ffff', '#0099ff'],
            spread: ['#ff00ff', '#ff99ff']
        };
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, colors[type][i % 2]));
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = `Score: ${this.score}`;
        document.getElementById('healthDisplay').textContent = `Health: ${this.health}`;
        
        // Update ultimate charge bar
        const ultimateBar = document.getElementById('ultimateBar');
        if (ultimateBar) {
            ultimateBar.style.width = `${this.ultimateCharge}%`;
            ultimateBar.style.backgroundColor = this.ultimateCharge >= 100 ? '#ff00ff' : '#7700ff';
        }
        
        // Update combo display
        const comboDisplay = document.getElementById('comboDisplay');
        if (comboDisplay) {
            comboDisplay.textContent = this.combo > 1 ? `${this.combo}x Combo!` : '';
            comboDisplay.style.fontSize = `${Math.min(24 + this.combo, 48)}px`;
        }
    }

    checkAchievements() {
        if (!this.achievements.firstKill.earned && this.score >= 10) {
            this.achievements.firstKill.earned = true;
            this.showAchievement("First Blood");
        }
        if (!this.achievements.combo10.earned && this.combo >= 10) {
            this.achievements.combo10.earned = true;
            this.showAchievement("Combo Master");
        }
        if (!this.achievements.ultimate.earned && this.isUltimateActive) {
            this.achievements.ultimate.earned = true;
            this.showAchievement("Ultimate Power");
        }
    }

    showAchievement(name) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement';
        achievement.innerHTML = `
            <i class="fas fa-trophy"></i>
            Achievement Unlocked: ${name}
        `;
        document.body.appendChild(achievement);
        
        // Animate achievement
        setTimeout(() => {
            achievement.style.right = '20px';
            setTimeout(() => {
                achievement.style.right = '-300px';
                setTimeout(() => achievement.remove(), 1000);
            }, 3000);
        }, 100);
    }

    activateUltimate() {
        if (this.ultimateCharge >= ULTIMATE_MAX && !this.isUltimateActive) {
            this.isUltimateActive = true;
            this.ultimateCharge = 0;
            
            // Create ultimate effect
            const numProjectiles = 36;
            for (let i = 0; i < numProjectiles; i++) {
                const angle = (Math.PI * 2 / numProjectiles) * i;
                const bullet = new Bullet(
                    this.player.x + this.player.width / 2,
                    this.player.y,
                    angle
                );
                bullet.speed *= 1.5;
                this.bullets.push(bullet);
            }
            
            // Screen flash effect
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            
            setTimeout(() => {
                flash.remove();
                this.isUltimateActive = false;
            }, 1000);
        }
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('restartButton').addEventListener('click', () => this.restart());
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.pause();
            } else if (e.key === 'q' || e.key === 'Q') {
                this.activateUltimate();
            } else if (e.key === '1') {
                this.currentWeapon = WEAPONS.LASER;
                this.updateWeaponVisuals();
            } else if (e.key === '2') {
                this.currentWeapon = WEAPONS.PLASMA;
                this.updateWeaponVisuals();
            } else if (e.key === '3') {
                this.currentWeapon = WEAPONS.MISSILE;
                this.updateWeaponVisuals();
            } else if (e.key === 'e' || e.key === 'E') {
                this.activateTimeStop();
            } else if (e.key === 'r' || e.key === 'R') {
                this.activateBlackHole();
            } else if (e.key === 'f' || e.key === 'F') {
                this.activateShield();
            } else if (e.key === 'v' || e.key === 'V') {
                this.cycleElement();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleSkillTree();
            }
        });

        // Initialize skill tree
        this.initializeSkillTree();

        // Mouse tracking for black hole ability
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    start() {
        // Initialize game state
        this.score = 0;
        this.health = 100;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Initialize player
        this.player = new Player(CANVAS_WIDTH / 2 - 15, CANVAS_HEIGHT - 50);
        
        // Initialize collections
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        
        // Initialize timers
        this.lastSpawnTime = Date.now();
        this.combo = 0;
        this.comboTimer = 0;
        
        // Initialize UI
        this.updateUI();
        this.initializeSkillTree();
        
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        
        // Start game loop
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    initializeSkillTree() {
        try {
            const createSkillButton = (skillName, category) => {
                const skill = SKILL_TREE[category][skillName];
                const button = document.createElement('div');
                button.className = 'skill-button';
                button.innerHTML = `
                    <span>${skillName.replace(/_/g, ' ')}</span>
                    <span class="skill-cost">${skill.cost} SP</span>
                `;
                button.title = skill.effect;
                
                if (this.unlockedSkills.has(skillName)) {
                    button.classList.add('unlocked');
                }
                
                button.addEventListener('click', () => {
                    if (this.unlockSkill(category, skillName)) {
                        button.classList.add('unlocked');
                        this.updateSkillPointsDisplay();
                    }
                });
                
                return button;
            };

            // Populate skill tree sections
            ['WEAPONS', 'ELEMENTS', 'ABILITIES'].forEach(category => {
                const container = document.getElementById(`${category.toLowerCase()}Skills`);
                if (container) {
                    Object.keys(SKILL_TREE[category]).forEach(skillName => {
                        container.appendChild(createSkillButton(skillName, category));
                    });
                }
            });

            // Initialize displays
            this.updateSkillPointsDisplay();
            this.updateElementDisplay();
        } catch (error) {
            console.error('Error initializing skill tree:', error);
        }
    }

    updateElementDisplay() {
        const indicator = document.getElementById('elementIndicator');
        const name = document.getElementById('elementName');
        
        if (indicator && name) {
            if (this.currentElement) {
                indicator.style.backgroundColor = this.currentElement.color;
                name.textContent = this.currentElement.effect.charAt(0).toUpperCase() + 
                                 this.currentElement.effect.slice(1);
            } else {
                indicator.style.backgroundColor = '#333';
                name.textContent = 'No Element';
            }
        }
    }

    toggleSkillTree() {
        const skillTree = document.getElementById('skillTree');
        if (skillTree.classList.contains('hidden')) {
            skillTree.classList.remove('hidden');
            this.pause();
        } else {
            skillTree.classList.add('hidden');
            this.pause();
        }
    }

    updateSkillPointsDisplay() {
        document.getElementById('skillPointsDisplay').textContent = `Skill Points: ${this.skillPoints}`;
        document.getElementById('levelDisplay').textContent = `Lv.${this.weaponLevel}`;
    }

    activateTimeStop() {
        if (this.abilities.timestop.ready) {
            this.timeStopActive = true;
            this.abilities.timestop.ready = false;
            this.abilities.timestop.lastUsed = Date.now();
            
            // Visual effect
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(0, 255, 255, 0.3)';
            flash.style.pointerEvents = 'none';
            document.body.appendChild(flash);
            
            setTimeout(() => {
                this.timeStopActive = false;
                flash.remove();
            }, ABILITIES.TIMESTOP.duration);
            
            setTimeout(() => {
                this.abilities.timestop.ready = true;
            }, ABILITIES.TIMESTOP.cooldown);
        }
    }

    activateBlackHole() {
        if (this.abilities.blackhole.ready) {
            this.blackHoleActive = true;
            this.blackHolePosition = { x: this.mouseX, y: this.mouseY };
            this.abilities.blackhole.ready = false;
            this.abilities.blackhole.lastUsed = Date.now();
            
            setTimeout(() => {
                this.blackHoleActive = false;
                this.blackHolePosition = null;
            }, ABILITIES.BLACKHOLE.duration);
            
            setTimeout(() => {
                this.abilities.blackhole.ready = true;
            }, ABILITIES.BLACKHOLE.cooldown);
        }
    }

    activateShield() {
        if (this.abilities.shield.ready) {
            this.player.shieldActive = true;
            this.abilities.shield.ready = false;
            this.abilities.shield.lastUsed = Date.now();
            
            setTimeout(() => {
                this.player.shieldActive = false;
            }, ABILITIES.SHIELD.duration);
            
            setTimeout(() => {
                this.abilities.shield.ready = true;
            }, ABILITIES.SHIELD.cooldown);
        }
    }

    gainExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.experienceToNextLevel) {
            this.weaponLevel++;
            this.experience -= this.experienceToNextLevel;
            this.experienceToNextLevel *= 1.5;
            this.skillPoints += 2;
            
            // Level up effect
            const levelUp = document.createElement('div');
            levelUp.className = 'level-up';
            levelUp.innerHTML = `
                <div class="level-up-title">LEVEL UP!</div>
                <div>Weapon Level ${this.weaponLevel}</div>
                <div class="skill-points">+2 Skill Points</div>
                <div class="press-tab">Press TAB to open Skill Tree</div>
            `;
            document.body.appendChild(levelUp);
            setTimeout(() => levelUp.remove(), 3000);
        }
    }

    unlockSkill(skillCategory, skillName) {
        const skill = SKILL_TREE[skillCategory][skillName];
        if (this.skillPoints >= skill.cost && !this.unlockedSkills.has(skillName)) {
            this.skillPoints -= skill.cost;
            this.unlockedSkills.add(skillName);
            this.applySkillEffect(skillCategory, skillName);
            return true;
        }
        return false;
    }

    applySkillEffect(category, skillName) {
        const skill = SKILL_TREE[category][skillName];
        switch(skillName) {
            case 'LASER_MASTERY':
                WEAPONS.LASER.damage *= 1.5;
                break;
            case 'PLASMA_MASTERY':
                WEAPONS.PLASMA.damage *= 1.5;
                break;
            case 'MISSILE_MASTERY':
                WEAPONS.MISSILE.damage *= 1.5;
                break;
            case 'DUAL_SHOT':
                this.player.dualShot = true;
                break;
            case 'RAPID_FIRE':
                this.player.shootDelay *= 0.7;
                break;
            // Add more skill effects
        }
    }

    cycleElement() {
        const elements = Object.values(ELEMENTS);
        if (!this.currentElement) {
            this.currentElement = elements[0];
        } else {
            const currentIndex = elements.indexOf(this.currentElement);
            this.currentElement = elements[(currentIndex + 1) % elements.length] || null;
        }
        this.updateWeaponVisuals();
    }

    updateWeaponVisuals() {
        if (this.currentElement) {
            this.currentWeapon.element = this.currentElement;
            // Update weapon appearance with elemental effects
            const elementalEffect = document.createElement('div');
            elementalEffect.className = 'elemental-effect';
            elementalEffect.style.backgroundColor = this.currentElement.color;
            document.body.appendChild(elementalEffect);
            setTimeout(() => elementalEffect.remove(), 500);
        }
    }

    applyElementalEffect(target, element) {
        if (!element) return;

        switch(element.effect) {
            case 'burn':
                // Apply damage over time
                let burnTicks = 5;
                const burnInterval = setInterval(() => {
                    if (burnTicks > 0 && target.health > 0) {
                        target.health -= 5;
                        this.createElementalParticles(target.x, target.y, ELEMENTS.FIRE.color);
                        burnTicks--;
                    } else {
                        clearInterval(burnInterval);
                    }
                }, 500);
                break;

            case 'freeze':
                // Slow enemy movement
                const originalSpeed = target.speed;
                target.speed *= 0.3;
                this.createElementalParticles(target.x, target.y, ELEMENTS.ICE.color);
                setTimeout(() => {
                    if (target.health > 0) target.speed = originalSpeed;
                }, element.duration);
                break;

            case 'chain':
                // Chain lightning to nearby enemies
                let remainingChains = element.chainCount;
                let lastTarget = target;
                while (remainingChains > 0) {
                    const nearestEnemy = this.findNearestEnemy(lastTarget, 100);
                    if (nearestEnemy) {
                        nearestEnemy.health -= 15;
                        this.createLightningEffect(lastTarget, nearestEnemy);
                        lastTarget = nearestEnemy;
                    }
                    remainingChains--;
                }
                break;

            case 'implode':
                // Create implosion effect
                this.createImplodeEffect(target.x, target.y, element.radius);
                this.enemies.forEach(enemy => {
                    const dx = target.x - enemy.x;
                    const dy = target.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < element.radius) {
                        enemy.health -= 30;
                    }
                });
                break;
        }
    }

    createElementalParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(x, y, color);
            particle.speedX *= 2;
            particle.speedY *= 2;
            this.particles.push(particle);
        }
    }

    createLightningEffect(source, target) {
        const lightning = {
            start: { x: source.x + source.width/2, y: source.y + source.height/2 },
            end: { x: target.x + target.width/2, y: target.y + target.height/2 },
            alpha: 1,
            segments: 5
        };

        const animate = () => {
            if (lightning.alpha > 0) {
                this.ctx.save();
                this.ctx.strokeStyle = `rgba(255, 255, 0, ${lightning.alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(lightning.start.x, lightning.start.y);

                // Create jagged lightning effect
                for (let i = 1; i < lightning.segments; i++) {
                    const x = lightning.start.x + (lightning.end.x - lightning.start.x) * (i/lightning.segments);
                    const y = lightning.start.y + (lightning.end.y - lightning.start.y) * (i/lightning.segments);
                    const offset = Math.random() * 20 - 10;
                    this.ctx.lineTo(x + offset, y + offset);
                }

                this.ctx.lineTo(lightning.end.x, lightning.end.y);
                this.ctx.stroke();
                this.ctx.restore();

                lightning.alpha -= 0.1;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    createImplodeEffect(x, y, radius) {
        const implode = {
            x, y, radius,
            currentRadius: radius,
            alpha: 1
        };

        const animate = () => {
            if (implode.currentRadius > 0) {
                this.ctx.save();
                this.ctx.strokeStyle = `rgba(255, 0, 255, ${implode.alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(implode.x, implode.y, implode.currentRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();

                implode.currentRadius -= 2;
                implode.alpha -= 0.02;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = PLAYER_SPEED;
        this.keys = {};
        this.lastShot = 0;
        this.shootDelay = 250;
        this.spreadShot = false;

        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    update() {
        // Movement
        if (this.keys['ArrowLeft'] || this.keys['a']) this.x -= this.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.x += this.speed;
        if (this.keys['ArrowUp'] || this.keys['w']) this.y -= this.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) this.y += this.speed;

        // Keep player in bounds
        this.x = Math.max(0, Math.min(this.x, CANVAS_WIDTH - this.width));
        this.y = Math.max(0, Math.min(this.y, CANVAS_HEIGHT - this.height));

        // Shooting
        if ((this.keys[' '] || this.keys['Space']) && Date.now() - this.lastShot > this.shootDelay) {
            if (this.spreadShot) {
                // Spread shot (3 bullets)
                game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 0));
                game.bullets.push(new Bullet(this.x + this.width / 2, this.y, -0.3));
                game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 0.3));
            } else {
                game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 0));
            }
            this.lastShot = Date.now();
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw effects based on active abilities
        if (game.ultimateCharge >= ULTIMATE_MAX) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 
                   this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw shield effect
        if (this.shieldActive) {
            const shieldPulse = 0.5 + Math.sin(Date.now() / 100) * 0.3;
            ctx.strokeStyle = `rgba(0, 255, 255, ${shieldPulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 
                   this.width * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Shield particles
            for (let i = 0; i < 5; i++) {
                const angle = (Date.now() / 500 + i * Math.PI * 2 / 5) % (Math.PI * 2);
                const radius = this.width * 1.2;
                const px = this.x + this.width/2 + Math.cos(angle) * radius;
                const py = this.y + this.height/2 + Math.sin(angle) * radius;
                
                ctx.fillStyle = `rgba(0, 255, 255, ${shieldPulse})`;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw player ship with weapon-specific colors
        const weaponColor = game.currentWeapon.color;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Weapon indicator
        ctx.fillStyle = weaponColor;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw engine glow with pulsing effect
        const glowIntensity = 0.3 + Math.sin(Date.now() / 100) * 0.2;
        ctx.fillStyle = `rgba(0, 255, 0, ${glowIntensity})`;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height + 10);
        ctx.lineTo(this.x + this.width * 3/4, this.y + this.height + 10);
        ctx.closePath();
        ctx.fill();
        
        // Draw ultimate shield effect
        if (game.isUltimateActive) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 
                   this.width * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class EnemyBullet {
    constructor(x, y, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 6;
        this.speedX = speedX;
        this.speedY = speedY;
        this.angle = Math.atan2(speedY, speedX);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Glowing effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        
        // Diamond shape
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, 0);
        ctx.lineTo(0, this.height/2);
        ctx.lineTo(-this.width/2, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle, weapon = WEAPONS.LASER) {
        this.x = x - weapon.size.width/2;
        this.y = y;
        this.width = weapon.size.width;
        this.height = weapon.size.height;
        this.speed = weapon.speed;
        this.angle = angle;
        this.weapon = weapon;
        this.damage = weapon.damage * (game.weaponLevel * 0.2 + 1); // Damage increases with weapon level
        
        // For missile tracking
        if (weapon.tracking) {
            this.target = this.findNearestEnemy();
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        
        return nearest;
    }

    update() {
        if (this.weapon.tracking && this.target && !game.timeStopActive) {
            // Homing missile logic
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // Gradually turn towards target
            const turnSpeed = 0.1;
            const angleDiff = targetAngle - this.angle;
            this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);
            
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            this.x += Math.sin(this.angle) * this.speed;
            this.y -= Math.cos(this.angle) * this.speed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.angle + Math.PI/2);
        
        // Draw weapon-specific bullet
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.weapon.color;
        ctx.fillStyle = this.weapon.color;
        
        switch(this.weapon) {
            case WEAPONS.LASER:
                // Laser beam
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                break;
                
            case WEAPONS.PLASMA:
                // Plasma ball
                ctx.beginPath();
                ctx.arc(-this.width/2, -this.height/2, this.width, 0, Math.PI * 2);
                ctx.fill();
                // Plasma glow
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(-this.width/2, -this.height/2, this.width * 1.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case WEAPONS.MISSILE:
                // Missile body
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                // Missile fins
                ctx.beginPath();
                ctx.moveTo(-this.width/2, this.height/2);
                ctx.lineTo(-this.width*1.5, this.height/2);
                ctx.lineTo(-this.width/2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(this.width/2, this.height/2);
                ctx.lineTo(this.width*1.5, this.height/2);
                ctx.lineTo(this.width/2, 0);
                ctx.closePath();
                ctx.fill();
                // Engine glow
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#ff0';
                ctx.beginPath();
                ctx.moveTo(-this.width/4, this.height/2);
                ctx.lineTo(this.width/4, this.height/2);
                ctx.lineTo(0, this.height);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

class BossEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.speed = 1;
        this.health = 200;
        this.maxHealth = 200;
        this.angle = 0;
        this.attackPattern = 0;
        this.lastAttack = 0;
        this.attackDelay = 1000;
    }

    update() {
        // Move in a figure-8 pattern
        this.angle += 0.02;
        this.x = CANVAS_WIDTH/2 + Math.sin(this.angle) * 100;
        this.y = Math.max(50, this.y + this.speed);
        
        // Attack patterns
        if (Date.now() - this.lastAttack > this.attackDelay) {
            this.attack();
            this.lastAttack = Date.now();
            this.attackPattern = (this.attackPattern + 1) % 3;
        }
    }

    attack() {
        switch(this.attackPattern) {
            case 0: // Spiral attack
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + this.angle;
                    game.bullets.push(new EnemyBullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        Math.cos(angle) * 3,
                        Math.sin(angle) * 3
                    ));
                }
                break;
            case 1: // Targeted attack
                const dx = game.player.x - this.x;
                const dy = game.player.y - this.y;
                const angle = Math.atan2(dy, dx);
                for (let i = -1; i <= 1; i++) {
                    game.bullets.push(new EnemyBullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        Math.cos(angle + i * 0.2) * 4,
                        Math.sin(angle + i * 0.2) * 4
                    ));
                }
                break;
            case 2: // Scatter attack
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    game.bullets.push(new EnemyBullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        Math.cos(angle) * 2,
                        Math.sin(angle) * 2
                    ));
                }
                break;
        }
    }

    draw(ctx) {
        // Draw boss ship
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.angle);
        
        // Main body
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2);
        ctx.lineTo(0, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(-this.width, this.height/4);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width, this.height/4);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Health bar
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = this.width * 1.5;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/4, this.y - 20, barWidth, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/4, this.y - 20, barWidth * healthPercentage, 5);
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = ENEMY_SPEED;
        this.health = 50;
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
    }

    draw(ctx) {
        // Draw enemy ship with shield effect
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        
        // Shield effect
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ship body
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(0, this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(0, -this.height / 2 - 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Health bar with gradient
        const healthPercentage = this.health / 50;
        const gradient = ctx.createLinearGradient(this.x, this.y - 10, this.x + this.width, this.y - 10);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#00ff00');
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, this.width, 3);
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y - 10, this.width * healthPercentage, 3);
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = 2;
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        
        switch(this.type) {
            case 'health':
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-this.width/4, -this.height/2, this.width/2, this.height);
                ctx.fillRect(-this.width/2, -this.height/4, this.width, this.height/2);
                break;
            case 'speed':
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.moveTo(-this.width/2, 0);
                ctx.lineTo(this.width/2, -this.height/2);
                ctx.lineTo(this.width/2, this.height/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'spread':
                ctx.fillStyle = '#ff00ff';
                for(let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.width/2 - i*4, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.alpha = 1;
        this.color = color;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
        this.rotation += this.rotationSpeed;
        this.speedY += 0.1; // Add gravity effect
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

const game = new Game();
