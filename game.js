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

let shootingDirection = 0;

birdVars = {
    startX: 50,
    startY: 50,
    animFrames: [
        frame0 = { x: 276, y: 112 },
        frame1 = { x: 276, y: 139 },
        frame2 = { x: 276, y: 164 }]
}


// GAME STATE
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    gameOver: 2
};

// START BUTTON COORD
const startBtn = {
    x: 120,
    y: 263,
    w: 83,
    h: 29
};


// =====================================================================================================
// --------------------------------------/ Classes Definition /-----------------------------------------
// =====================================================================================================



class BoxCollider {
    constructor(tag, width, height, x, y) {
        this.tag = tag;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.active = true;
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

// =====================================================================================================
// --------------------------------------/ Game Manager /---------------------------------------------
// =====================================================================================================

class GameManager {
    constructor() {
        this.bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
        this.currentScore = 0;
        this.objects = [];
        this.colliders = [];
    }

    registerObject(object) {
        this.objects.push(object);

        if (object.colliders != null) {
            object.colliders.forEach(element => {
                this.registerCollider(element);
            });
        }
    }
    getObjectsByName(name) {
        let objectsWithName = this.objects.filter(obj => obj.name === name);
        return objectsWithName;
    }

    deregisterObject(object) {
        this.objects = this.objects.filter(obj => obj !== object);
        // unregister colliders of the objects;
        if (object.colliders != null) {
            object.colliders.forEach(element => {
                this.deregisterCollider(element);
            });
        }
    }

    registerCollider(collider) {
        this.colliders.push(collider);
    }

    deregisterCollider(collider) {
        this.colliders = this.colliders.filter(obj => obj !== collider);
    }

    renderObjects() {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        this.objects.forEach(element => {
            element.draw();
        });
    }

    updateObjects() {
        this.objects.forEach(element => {
            if (element.update != null) {
                element.update();
            }
        });
    }

    checkCollision(colliderOne, colliderTwo, onCollision) {
        let xCheck = colliderOne.x < colliderTwo.x + colliderTwo.width &&
            colliderOne.x + colliderOne.width > colliderTwo.x;

        let yCheck = colliderOne.y < colliderTwo.y + colliderTwo.height &&
            colliderOne.y + colliderOne.height > colliderTwo.y;

        if (xCheck && yCheck) {
            if (onCollision != null) {
                onCollision(colliderOne, colliderTwo);
            }
        }
    }

    checkCollisionByTag(collider, tag, onCollision) {
        if (!collider.active) return;

        this.colliders.forEach(element => {
            if (element != collider && element.active) {
                if (element.tag == tag) {
                    this.checkCollision(collider, element, onCollision);
                }
            }
        });
    }
}



class Entity {
    constructor(name, sprite, active, visible, x, y, w, h) {
        this.name = name;
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.active = active;
        this.visible = visible;
        this.colliders = [];
    }

    updateColliders() {
        this.colliders.forEach(collider => {
            collider.x = this.x;
            collider.y = this.y;
        });
    }

    update() { }

    draw() {
        if (this.visible) {
            this.sprite.draw(this.x, this.y, this.w, this.h);
        }
    }
}


// =====================================================================================================
// --------------------------------------/ Classes that extend Entity /---------------------------------
// =====================================================================================================

class ShootingTarget extends Entity {
    constructor(name, sprite, active, visible, xSpeed, x, y, w, h) {
        super(name, sprite, active, visible, x, y, w, h);
        this.xSpeed = xSpeed;

        // create collider
        this.colliders.push(new BoxCollider("shootingTarget", w, h, this.x, this.y));
    }

    update() {
        if (this.active) {

            this.x += this.xSpeed; // move shooting target
            // if target is outside the screen move it to the random position between two incomming pipes
            if (this.x + this.w < 0) {
                this.x = (cvs.clientWidth) * 1;
            }
            this.updateColliders(); // update position of the collider
        }
    }

}
class Arrow extends Entity {
    constructor(name, sprite, active, visible, ySpeed, x, y, w, h) {
        super(name, sprite, active, visible, x, y, w, h);
        this.ySpeed = ySpeed;
        this.currentFrame = framesCount;// save frame to keep track of "lifetime" of arrow
        // create collider
        this.colliders.push(new BoxCollider("arrow", w, h, this.x, this.y));
    }

    update() {
        if (this.active) {
            this.y += this.ySpeed;

            this.updateColliders();
            // destroy arrow after  15 frames in the game
            if (framesCount - this.currentFrame > 15) {
                this.destroySelf();
            }
        }
    }

    destroySelf() {
        gameManager.deregisterObject(this);
    }
}

class CustomText extends Entity {
    constructor(name, text, x, y, visible, font) {
        super(name, null, null, null, x, y, null, null);
        this.text = text;
        this.x = x;
        this.y = y;
        this.visible = visible;
        this.font = font;
    }

    draw() {
        if (this.visible) {
            ctx.fillStyle = "#FFF";
            ctx.strokeStyle = "#000";
            ctx.font = this.font;
            ctx.fillText(this.text, this.x, this.y);
            ctx.strokeText(this.text, this.x, this.y);
        }
    }
}

class Foreground extends Entity {
    constructor(name, sprite, active, visible, xSpeed, x, y, w, h) {
        super(name, sprite, active, visible, x, y, w, h);
        this.xSpeed = xSpeed;
        this.colliders.push(new BoxCollider("foreground", w, h, x, y));
    }

    draw() {
        if (this.visible) {
            this.sprite.draw(this.x, this.y, this.w, this.h);
            this.sprite.draw(this.x + this.w, this.y, this.w, this.h);
        }
    }

    update() {
        if (this.active) {
            this.x = (this.x + this.xSpeed) % (this.w / 2);

            // updating colliders of the foreground is not needed
            // The foreground gets created right under the bird, there is no need to move collider of the foreground
            // this.updateColliders();
        }
    }
}

class Bird extends Entity {
    constructor(name, sprite, active, visible, animationCoords, x, y, w, h, yVelocity, gravity, jumpForce) {
        super(name, sprite, active, visible, x, y, w, h);
        this.animationCoords = animationCoords;
        this.animFrame = 0;
        this.yVelocity = yVelocity;
        this.gravity = gravity;
        this.jumpForce = jumpForce;
        this.colliders.push(new BoxCollider("bird", w, h, x, y));
    }

    setAnimationFrame() {
        // IF THE GAME STATE IS GET READY STATE, THE BIRD MUST FLAP SLOWLY
        this.period = state.current == state.getReady ? 10 : 5;
        // WE INCREMENT THE FRAME BY 1, EACH PERIOD
        this.animFrame += framesCount % this.period == 0 ? 1 : 0;
        // FRAME GOES FROM 0 To 4, THEN AGAIN TO 0
        this.animFrame = this.animFrame % this.animationCoords.length;

        this.sprite.imageX = this.animationCoords[this.animFrame].x;
        this.sprite.imageY = this.animationCoords[this.animFrame].y;
    }

    jump() {
        this.yVelocity = -this.jumpForce;
    }

    update() {
        this.setAnimationFrame();

        if (this.active) {
            this.yVelocity += this.gravity;
            this.y += this.yVelocity;

            if (this.y + this.h / 2 >= foreground.y) {
                this.y = foreground.y - this.h / 2;
            } else if (this.y < 0) {
                this.y = 0;
            }
            this.updateColliders();
        }

    }
}


class PipeObstacle extends Entity {
    constructor(name, topPipeSpr, botPipeSpr, active, visible, xSpeed, gap, maxYPos, x, y, w, h) {

        super(name, null, active, visible, x, y, w, h);
        this.xSpeed = xSpeed;

        this.gap = gap;
        this.maxYPos = maxYPos;

        this.topPipeY = this.y;
        this.bottomPipeY = this.y + this.h + this.gap;

        this.topPipeCollider = new BoxCollider("obstacle", this.w, this.h, this.x, this.topPipeY);
        this.botPipeCollider = new BoxCollider("obstacle", this.w, this.h, this.x, this.BottomPipeY);

        this.scoreCollider = new BoxCollider("scoreIncreaser", 5, this.gap, this.x + this.w, this.y + this.h);

        this.colliders.push(this.topPipeCollider);
        this.colliders.push(this.botPipeCollider);
        this.colliders.push(this.scoreCollider);
    }

    updateColliders() {
        this.topPipeCollider.x = this.x;
        this.topPipeCollider.y = this.topPipeY;

        this.botPipeCollider.x = this.x;
        this.botPipeCollider.y = this.bottomPipeY;

        this.scoreCollider.x = this.x + this.w;
        this.scoreCollider.y = this.y + this.h;
    }

    draw() {
        topPipeSpr.draw(this.x, this.topPipeY, this.w, this.h);
        botPipeSpr.draw(this.x, this.bottomPipeY, this.w, this.h);
    }

    update() {
        if (this.active) {
            this.x += this.xSpeed;

            this.updateColliders();

            if (this.x + this.w < 0) {
                gameManager.deregisterObject(this);
                generatePipeObstacle(this.gap, this.maxYPos);
            }
        }
    }
}


// =====================================================================================================
// --------------------------------------/ Game-related functions /-------------------------------------
// =====================================================================================================
function CheckMouseClickOnStart(clickX, clickY) {
    return (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y &&
        clickY <= startBtn.y + startBtn.h);
}


function generatePipeObstacle(gap, maxYpos) {
    let upperPipeYPos = maxYpos * (Math.random() + 1);
    const generatedObstacle = new PipeObstacle("pipeObstacle", topPipeSpr, botPipeSpr, true, true, -2, gap, maxYpos, cvs.width, -upperPipeYPos,
        topPipeSpr.width, topPipeSpr.height);

    gameManager.registerObject(generatedObstacle);
}

function shootArrow(x, y, speed) {

    arrow = new Arrow("arrow", arrowSpr, true, true, speed, x, y, arrowSpr.width, arrowSpr.height);
    gameManager.registerObject(arrow);
    shootingDirection
}

function deregisterPipes() {
    let pipes = gameManager.getObjectsByName("pipeObstacle");
    pipes.forEach(element => {
        gameManager.deregisterObject(element);
    });
}
// =====================================================================================================
// --------------------------------------/ Game State functions /---------------------------------------
// =====================================================================================================

function StartGame() {
    // set state of the game
    state.current = state.game;

    SWOOSHING.play();

    // hide get ready screen
    getReady.visible = false;

    //activate bird
    bird.active = true;

    //generate first pipe obstacle
    generatePipeObstacle(95, 150);

    //enable shooting target
    shootingTarget.active = true;

    //activate foreground
    foreground.active = true;

    //show playerScore
    playerScore.visible = true;
}

function RestartGame() {

    // set state of the game
    state.current = state.getReady;

    // reset bird variables to defaults
    bird.yVelocity = 0;
    bird.active = false;
    bird.x = birdVars.startX;
    bird.y = birdVars.startY;

    // show get ready screen, hide game over screen
    getReady.visible = true;
    gameOver.visible = false;

    // reset shooting target
    shootingTarget.x = cvs.clientWidth;

    // stop rendering and updating pipe entities that are in the game
    deregisterPipes();

    // deregister end and best scores
    gameManager.deregisterObject(gameManager.getObjectsByName("endScore")[0]);
    gameManager.deregisterObject(gameManager.getObjectsByName("bestScore")[0]);

    // reset current score
    playerScore.text = 0;
    gameManager.currentScore = 0;

}


function ShowDeathScreen() {
    state.current = state.gameOver;

    foreground.active = false;
    gameManager.registerObject(gameOver);
    gameOver.visible = true;
    shootingTarget.active = false;
    endScore = new CustomText("endScore", gameManager.currentScore, 225, 186, true, "25px Teko");
    gameManager.registerObject(endScore);

    bestScore = new CustomText("bestScore", gameManager.bestScore, 225, 228, true, "25px Teko");
    gameManager.registerObject(bestScore);
    let pipes = gameManager.getObjectsByName("pipeObstacle");
    pipes.forEach(element => {
        element.active = false;
    });


}


// =====================================================================================================
// --------------------------------------/ Initializing objects /---------------------------------------
// =====================================================================================================

// Object manager
const gameManager = new GameManager();

// Background
// one background entity is too thin to cover whole screen
// lets create two entities with the same sprite for that
const backgroundSpr = new Sprite(image, 0, 0, 275, 226);

const backgroundLeft = new Entity("backgroundLeft", backgroundSpr, true, true, 0, cvs.height - backgroundSpr.height,
    backgroundSpr.width, backgroundSpr.height);

const backgroundRight = new Entity("backgroundRight", backgroundSpr, true, true, backgroundSpr.width, cvs.height - backgroundSpr.height,
    backgroundSpr.width, backgroundSpr.height);

// Foreground 
const foregroundSpr = new Sprite(image, 276, 0, 224, 112);
const foreground = new Foreground("foreground", foregroundSpr, false, true, -2, 0, cvs.height - foregroundSpr.height,
    foregroundSpr.width, foregroundSpr.height);

// GetReady
const getReadySpr = new Sprite(image, 0, 228, 173, 152);
const getReady = new Entity("getReady", getReadySpr, true, true, cvs.width / 2 - getReadySpr.width / 2, 100,
    getReadySpr.width, getReadySpr.height);

// Game gameOver
const gameOverSpr = new Sprite(image, 175, 228, 225, 202);
const gameOver = new Entity("gameOver", gameOverSpr, false, false, cvs.width / 2 - gameOverSpr.width / 2, 90, gameOverSpr.width, gameOverSpr.height);

const playerScore = new CustomText("currentScore", 0, cvs.clientWidth / 2, 50, false, "35px Teko");

// Pipe Sprites
const topPipeSpr = new Sprite(image, 554, 0, 52, 400);
const botPipeSpr = new Sprite(image, 502, 0, 52, 400);

// Arrow Sprite
const arrowSpr = new Sprite(image, 431, 119, 6, 29);


// Shooting target
const shootingTargetSpr = new Sprite(image, 415, 170, 57, 7);

const shootingTarget = new ShootingTarget("shootingTarget", shootingTargetSpr, false, true,
    -2, cvs.clientWidth * 1.7, 30, shootingTargetSpr.width / 2, shootingTargetSpr.height);



// Bird 
const birdSpr = new Sprite(image, frame0.x, frame0.y, 36, 26);
const bird = new Bird("bird", birdSpr, false, true, birdVars.animFrames, birdVars.startX, birdVars.startY, 34, 26, 0, 0.25, 4.6);


//Registering Objects to game manager
gameManager.registerObject(backgroundLeft);
gameManager.registerObject(backgroundRight);
gameManager.registerObject(playerScore);
gameManager.registerObject(foreground);
gameManager.registerObject(shootingTarget);

gameManager.registerObject(bird);

gameManager.registerObject(getReady);



// =====================================================================================================
// --------------------------------------/ Click Listener /---------------------------------------------
// =====================================================================================================

cvs.addEventListener("click", function (evt) {
    switch (state.current) {
        case state.getReady:
            StartGame();
            break;

        case state.game:
            bird.jump();
            FLAP.play();

            // switch direction of shooting with every click
            let arrowSpeed = 15;
            if (shootingDirection == 0) {
                shootingDirection = 1;
                arrowSpeed *= 1;
            } else if (shootingDirection == 1) {
                shootingDirection = 0;
                arrowSpeed *= -1;
            }

            // shoot arrow
            shootArrow(bird.x + bird.w / 2, bird.y - bird.h, arrowSpeed);
            break;

        case state.gameOver:
            let rect = cvs.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;
            if (CheckMouseClickOnStart(clickX, clickY)) {
                RestartGame();
            }
            break;
    }
});

// =====================================================================================================
// --------------------------------------/ Collision Callbacks /----------------------------------------
// =====================================================================================================

function onBirdDeath(collided, collider) {
    HIT.play();
    ShowDeathScreen();
}

function onIncreaseScore(collided, collider) {
    gameManager.currentScore += 1;
    playerScore.text = gameManager.currentScore;
    SCORE_S.play();
    if (gameManager.currentScore > gameManager.bestScore) {
        gameManager.bestScore = gameManager.currentScore;
        localStorage.setItem("bestScore", gameManager.bestScore);
    }
    collider.active = false;
}

function onBirdHitFloor(collided, collider) {
    DIE.play();
    ShowDeathScreen();
}


function checkCollisions() {
    gameManager.checkCollisionByTag(shootingTarget.colliders[0], "arrow", onIncreaseScore);
    gameManager.checkCollisionByTag(bird.colliders[0], "obstacle", onBirdDeath);
    gameManager.checkCollisionByTag(bird.colliders[0], "foreground", onBirdHitFloor);
    gameManager.checkCollisionByTag(bird.colliders[0], "scoreIncreaser", onIncreaseScore);
}

// =====================================================================================================
// --------------------------------------/ GameLoop /---------------------------------------------------
// =====================================================================================================
function loop() {
    gameManager.updateObjects();
    gameManager.renderObjects();

    if (state.current == state.game) {
        checkCollisions();
    }
    framesCount++;
    requestAnimationFrame(loop);
}
loop();
