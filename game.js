// SELECT CVS
const cvs = document.getElementById("gameCanvas");
const ctx = cvs.getContext("2d");

// GAME VARS AND CONSTS
let framesCount = 0;
const DEGREE = Math.PI / 180;

// LOAD SPRITE IMAGE
const image = new Image();
image.src = "img/sprite.png";

// LOAD SOUNDS
const SCORE_S = new Audio();
SCORE_S.src = "audio/sfx_point.wav";

const FLAP = new Audio()
FLAP.src = "audio/sfx_flap.wav";

const HIT = new Audio();
HIT.src = "audio/sfx_hit.wav";

const SWOOSHING = new Audio();
SWOOSHING.src = "audio/sfx_swooshing.wav";

const DIE = new Audio();
DIE.src = "audio/sfx_die.wav";


// GAME STATE
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

// START BUTTON COORD
const startBtn = {
    x: 120,
    y: 263,
    w: 83,
    h: 29
};

class BoxCollider {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}

class Sprite {
    constructor(image, imageX, imageY, width, height) {
        this.image = image;
        this.imageX = imageX;
        this.imageY = imageY;
        this.width = width;
        this.height = height;
    }

    draw(drawX, drawY, drawWidth, drawHeight) {
        ctx.drawImage(this.image, this.imageX, this.imageY, this.width, this.height,
            drawX, drawY, drawWidth, drawHeight);
    }
}

class Entity {
    constructor(sprite, x, y, w, h) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    update() {

    }
    draw() {
        this.sprite.draw(this.x, this.y, this.w, this.h);
    }
}


class Bird extends Entity {
    constructor(sprite, animationCoords, x, y, w, h) {

        super(sprite, x, y, w, h);

        this.animationCoords = animationCoords;
        this.animFrame = 0;
    }
    update() {
        // IF THE GAME STATE IS GET READY STATE, THE BIRD MUST FLAP SLOWLY
        this.period = state.current == state.getReady ? 10 : 5;
        // WE INCREMENT THE FRAME BY 1, EACH PERIOD
        this.animFrame += framesCount % this.period == 0 ? 1 : 0;
        // FRAME GOES FROM 0 To 4, THEN AGAIN TO 0
        this.animFrame = this.animFrame % this.animationCoords.length;

        this.sprite.imageX = this.animationCoords[this.animFrame].x;
        this.sprite.imageY = this.animationCoords[this.animFrame].y;

    }
}

class Foreground extends Entity {
    constructor(sprite, xSpeed, x, y, w, h) {
        super(sprite, x, y, w, h);
        this.xSpeed = xSpeed;
    }
    draw() {
        this.sprite.draw(this.x, this.y, this.w, this.h);
        this.sprite.draw(this.x + this.w, this.y, this.w, this.h);
    }
    update() {
        this.x = (this.x + this.xSpeed) % (this.w / 2);
        // this.x = (this.x + this.xSpeed); 

    }
}


//Background object
const backgroundSpr = new Sprite(image, 0, 0, 275, 226);
const background = new Foreground(backgroundSpr, 0, 0, cvs.height - backgroundSpr.height,
    backgroundSpr.width, backgroundSpr.height);

//Foreground Object
const foregroundSpr = new Sprite(image, 276, 0, 224, 112);
const foreground = new Foreground(foregroundSpr, -2, 0, cvs.height - foregroundSpr.height,
    foregroundSpr.width, foregroundSpr.height);

//GetReady object
const getReadySpr = new Sprite(image, 0, 228, 173, 152);
const getReady = new Entity(getReadySpr, cvs.width / 2 - getReadySpr.width / 2, 100,
    getReadySpr.width, getReadySpr.height);

//Game over object
const gameOverSpr = new Sprite(image, 175, 228, 225, 202);
const gameOver = new Entity(gameOverSpr, cvs.width / 2 - gameOverSpr.width / 2, 90, gameOverSpr.width, gameOverSpr.height);

//Bird
const birdAnimCoords = [
    { x: 276, y: 112 },
    { x: 276, y: 139 },
    { x: 276, y: 164 },
    { x: 276, y: 139 }
];
const birdSpr = new Sprite(image, 276, 112, 36, 26);
const birdb = new Bird(birdSpr, birdAnimCoords, 50, 50, 34, 26);
// CONTROL THE GAME
cvs.addEventListener("click", function (evt) {

    switch (state.current) {
        case state.getReady:
            state.current = state.game;
            SWOOSHING.play();
            break;
        case state.game:
            if (bird.y - bird.radius <= 0) return;
            bird.flap();
            FLAP.play();
            break;
        case state.over:
            let rect = cvs.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;

            // CHECK IF WE CLICK ON THE START BUTTON
            if (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y &&
                clickY <= startBtn.y + startBtn.h) {
                pipes.reset();
                bird.yVelocityReset();
                score.reset();
                state.current = state.getReady;
            }
            break;
    }
});

// BIRD
const bird = {
    animation: [
        { sX: 276, sY: 112 },
        { sX: 276, sY: 139 },
        { sX: 276, sY: 164 },
        { sX: 276, sY: 139 }
    ],
    x: 50,
    y: 150,
    w: 34,
    h: 26,

    radius: 12,

    frame: 0,

    gravity: 0.25,
    jump: 4.6,
    yVelocity: 0,
    rotation: 0,

    render: function () {
        let bird = this.animation[this.frame];

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(image, bird.sX, bird.sY, this.w, this.h, - this.w / 2, - this.h / 2, this.w, this.h);

        ctx.restore();
    },

    flap: function () {
        this.yVelocity = - this.jump;
    },

    update: function () {
        // IF THE GAME STATE IS GET READY STATE, THE BIRD MUST FLAP SLOWLY
        this.period = state.current == state.getReady ? 10 : 5;
        // WE INCREMENT THE FRAME BY 1, EACH PERIOD
        this.frame += framesCount % this.period == 0 ? 1 : 0;
        // FRAME GOES FROM 0 To 4, THEN AGAIN TO 0
        this.frame = this.frame % this.animation.length;

        if (state.current == state.getReady) {
            this.y = 150; // RESET POSITION OF THE BIRD AFTER GAME OVER
        } else {
            this.yVelocity += this.gravity;
            this.y += this.yVelocity;

            if (this.y + this.h / 2 >= cvs.height - foreground.h) {
                this.y = cvs.height - foreground.h - this.h / 2;
                if (state.current == state.game) {
                    state.current = state.over;
                    DIE.play();
                }
            }
            // IF THE yVelocity IS GREATER THAN THE JUMP MEANS THE BIRD IS FALLING DOWN
            // if (this.yVelocity >= this.jump) {
            //     this.rotation = 90 * DEGREE;
            //     this.frame = 1;
            // } else {
            //     this.rotation = -25 * DEGREE;
            // }
        }
    },
    yVelocityReset: function () {
        this.yVelocity = 0;
    }
}

// PIPES
const pipes = {
    position: [],

    top: {
        sX: 553,
        sY: 0
    },
    bottom: {
        sX: 502,
        sY: 0
    },

    w: 53,
    h: 400,
    gap: 85,
    maxYPos: -150,
    dx: 2,

    render: function () {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;

            // top pipe
            ctx.drawImage(image, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);

            // bottom pipe
            ctx.drawImage(image, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);
        }
    },

    update: function () {
        if (state.current !== state.game) return;

        if (framesCount % 100 == 0) {
            this.position.push({
                x: cvs.width,
                y: this.maxYPos * (Math.random() + 1)
            });
        }
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let bottomPipeYPos = p.y + this.h + this.gap;

            // COLLISION DETECTION
            // TOP PIPE
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w &&
                bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                state.current = state.over;
                HIT.play();
            }
            // BOTTOM PIPE
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w &&
                bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h) {
                state.current = state.over;
                HIT.play();
            }

            // MOVE THE PIPES TO THE LEFT
            p.x -= this.dx;

            // if the pipes go beyond canvas, we delete them from the array
            if (p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                SCORE_S.play();
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },

    reset: function () {
        this.position = [];
    }

}

// SCORE
const score = {
    best: parseInt(localStorage.getItem("best")) || 0,
    value: 0,

    render: function () {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";

        if (state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, cvs.width / 2, 50);
            ctx.strokeText(this.value, cvs.width / 2, 50);

        } else if (state.current == state.over) {
            // SCORE VALUE
            ctx.font = "25px Teko";
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            // BEST SCORE
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },

    reset: function () {
        this.value = 0;
    }
}

// render
function render() {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    background.draw();
    pipes.render();

    foreground.draw();
    bird.render();
    birdb.draw();

    if (state.current == state.getReady) {
        getReady.draw();
    }
    else if (state.current == state.over) {
        gameOver.draw();
    }
    score.render();

}
// UPDATE
function update() {
    bird.update();
    birdb.update();
    if (state.current == state.game) {
        foreground.update();
    }
    pipes.update();
}

// LOOP
function loop() {
    update();
    render();
    framesCount++;

    requestAnimationFrame(loop);
}
loop();
