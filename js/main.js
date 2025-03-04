const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.score = 0;
        this.gameLoop = null;
        this.isPaused = false;
        
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        
        this.setupEventListeners();
    }

    start() {
        this.score = 0;
        this.isPaused = false;
        this.player = {
            x: CANVAS_WIDTH / 2 - 20,
            y: CANVAS_HEIGHT - 60,
            width: 40,
            height: 40,
            health: 100,
            draw: (ctx) => {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        };
        
        document.getElementById('startScreen').style.display = 'none';
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    update() {
        if (this.isPaused) return;

        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw player
        this.player.draw(this.ctx);

        // Update UI
        document.getElementById('scoreDisplay').textContent = `Score: ${this.score}`;
        document.getElementById('healthDisplay').textContent = `Health: ${this.player.health}`;

        // Continue game loop
        this.gameLoop = requestAnimationFrame(() => this.update());
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.start());
        
        window.addEventListener('keydown', (e) => {
            if (!this.player) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.player.x = Math.max(0, this.player.x - 5);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.player.x = Math.min(CANVAS_WIDTH - this.player.width, this.player.x + 5);
                    break;
                case 'ArrowUp':
                case 'w':
                    this.player.y = Math.max(0, this.player.y - 5);
                    break;
                case 'ArrowDown':
                case 's':
                    this.player.y = Math.min(CANVAS_HEIGHT - this.player.height, this.player.y + 5);
                    break;
                case 'p':
                case 'P':
                    this.isPaused = !this.isPaused;
                    break;
            }
        });
    }
}

// Initialize game
const game = new Game();
