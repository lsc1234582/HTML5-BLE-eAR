var myGameArea = {
    //uiCanvas: document.createElement("canvas"),
    canvas : document.createElement("canvas"),
    fgCanvas: document.createElement("canvas"),
    bgCanvas: document.createElement("canvas"),
    backgroundImage: new Image(),
    start : function() {
        this.canvas.width = 1000;
        this.canvas.height = 600;
        this.fgCanvas.width = 1000;
        this.fgCanvas.height = 600;
        this.bgCanvas.width = 1000;
        this.bgCanvas.height = 600;
        //this.uiCanvas.width =  500;
        //this.uiCanvas.height = 200;
        this.backgroundImage.src = "static/Background2.png";
        this.gameLogic = {
            groundY : 500,
            heroSpeedXInit : 150,
            // heroSpeedX is required in many different component, thus global
            heroSpeedX : 200,
            // the area that the hero is allowed to be in
            heroFocusLeft: 300,
            heroFocusRight: 700,
            // the area that zombies are allowed to be in
            zombieRangeLeft: -200,
            zombieRangeRight: 1200,
            airDragAcc : 80
        };
        this.context = this.canvas.getContext("2d");
        this.fgContext = this.fgCanvas.getContext("2d");
        this.bgContext = this.bgCanvas.getContext("2d");
        //this.uiContext = this.uiCanvas.getContext("2d");
        this.deltaTime = 20;
        // frame number counter, could overflow but not a problem when only
        // used to spawn obstacles and zombies
        document.body.insertBefore(this.bgCanvas, document.body.childNodes[0]);
        document.body.insertBefore(this.fgCanvas, document.body.childNodes[1]);
        document.body.insertBefore(this.canvas, document.body.childNodes[2]);
        //document.body.insertBefore(this.uiCanvas, document.body.childNodes[3]);
        //this.uiCanvas.style.position = "absolute";
        //this.uiCanvas.style.left = "500px";
        //this.uiCanvas.style.top = "100px";
        //this.uiCanvas.style.zindex = "4";
        this.canvas.style.position = "absolute";
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
        this.canvas.style.zindex = "3";
        this.fgCanvas.style.position = "absolute";
        this.fgCanvas.style.left = "0px";
        this.fgCanvas.style.top = "0px";
        this.fgCanvas.style.zindex = "2";
        this.bgCanvas.style.position = "absolute";
        this.bgCanvas.style.left = "0px";
        this.bgCanvas.style.top = "0px";
        this.bgCanvas.style.zindex = "1";
        //this.interval = setInterval(myGame.updateGame, this.deltaTime);
        window.addEventListener("keydown", function (e) {
            myGameArea.key = e.keyCode;
        });
        window.addEventListener("keyup", function (e) {
            myGameArea.key = false;
        });
        //this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgContext.drawImage(this.backgroundImage, 0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.context.font = "20px Georgia";
        this.context.fillStyle = "white";
        //this.uiContext.font = "20px Georgia";
        //this.uiContext.color = "white";
        this.animationID = window.requestAnimationFrame(myGame.updateGame);
    },
    clear : function(){
        this.context.fillStyle = "blue";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //this.context.drawImage(this.backgroundImage, 0, 0);
        //this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {
        //clearInterval(this.interval);
        window.cancelAnimationFrame(this.animationID);
    }
};

function clip(x, min, max){
    return Math.min(max, Math.max(min, x))
}

function Foreground(image, gameArea) {
    this.width = gameArea.canvas.width;
    this.x1 = 0;
    this.x2 = this.width;
    this.y = gameArea.gameLogic.groundY;
    //this.y = 500;
    this.updatePos = function() {
        var speedX = - gameArea.gameLogic.heroSpeedX;
        this.x1 = this.x1 + speedX * gameArea.deltaTime / 1000;
        this.x2 = this.x2 + speedX * gameArea.deltaTime / 1000;
        if (this.x1 <= -this.width) {this.x1 = this.width;}
        if (this.x2 <= -this.width) {this.x2 = this.width;}
    }
    this.render = function() {
        gameArea.fgContext.drawImage(image, this.x1, this.y, this.width, 100);
        gameArea.fgContext.drawImage(image, this.x2, this.y, this.width, 100);
    }
}

function Obstacle(width, height, spriteSheet, x, y, gameArea, obstacles) {
    this.width = width;
    this.height = height;
    this.gameArea = gameArea;
    this.collided = false;

    this.x = x;
    this.y = y;
    this.leftLimit = - this.width;
    this.rightLimit = gameArea.canvas.width;
    this.render = function() {
        var ctx = this.gameArea.context;
        ctx.drawImage(spriteSheet, this.x, this.y, this.width, this.height);
    }
    this.clear = function() {
        var ctx = this.gameArea.context;

        ctx.clearRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    }
    // Update position
    this.updatePos = function() {
        var speedX = - gameArea.gameLogic.heroSpeedX;
        // Update position
        this.x = this.x + speedX * this.gameArea.deltaTime / 1000;
        // Obstacles only travels in one direction. Suffices to only check against left limit
        // Remove itself from the obstacles array when going out of limits
        if (this.x <= this.leftLimit) {
            obstacles.splice(obstacles.indexOf(this), 1);
        }
    }
}

function Zombie(width, height, runSpriteSheet, x, y, speedX, gameArea, zombies, hero) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = 0;
    this.gameArea = gameArea;

    this.runSpriteSheet = runSpriteSheet;

    this.activeSpriteSheet = runSpriteSheet;
    this.activeSpriteSheetRow = 2;
    this.activeSpriteSheetCol = 4;
    this.activeSpriteSheetMaxIndex = 8;
    this.spriteDeltaTime = 1000 / 12;
    this.animeTimeAcc = 0;
    this.spriteIndex = 0;
    this.spriteSrcCoord = [0, 0];


    this.render = function(deltaTime) {
        this.animeTimeAcc += deltaTime;
        if (this.animeTimeAcc >= this.spriteDeltaTime) {
            this.animeTimeAcc = 0;
            this.spriteIndex += 1;
            if ((this.activeSpriteSheet != this.runSpriteSheet) && this.spriteIndex == this.activeSpriteSheetMaxIndex){
                this.spriteIndex = 0;
                this.activeSpriteSheet = this.runSpriteSheet;
                this.activeSpriteSheetRow = 2;
                this.activeSpriteSheetCol = 4;
                this.activeSpriteSheetMaxIndex = 8;
            } else {
                this.spriteIndex %= this.activeSpriteSheetMaxIndex;
            }
            this.spriteSrcCoord = indexToCoord(this.spriteIndex, this.width, this.height, this.activeSpriteSheetRow, this.activeSpriteSheetCol);
        }
        var ctx = gameArea.context;
        ctx.drawImage(this.activeSpriteSheet, this.spriteSrcCoord[0], this.spriteSrcCoord[1], this.width, this.height, this.x, this.y, this.width, this.height);
    }
    this.clear = function() {
        var ctx = this.gameArea.context;

        ctx.clearRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    }
    this.updatePos = function() {
        // Simple Zombie AI
        // Positive velocity if Hero is ahead, negative velocity otherwise
        var velocity = this.speedX;
        if (hero.x < this.x) {
            velocity = -this.speedX;
        }
        // Speed of zombie relative to player
        var screenVelocity = velocity - this.gameArea.gameLogic.heroSpeedX;
        this.x = this.x + screenVelocity * this.gameArea.deltaTime / 1000;
        // Remove itself from the zombies array when going out of limits
        if (this.x <= this.gameArea.gameLogic.zombieRangeLeft ||
                this.x >= this.gameArea.gameLogic.zombieRangeRight) {
            zombies.splice(zombies.indexOf(this), 1);
        }
    }

    this.crashWith = function(otherObj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherObj.x;
        var otherright = otherObj.x + (otherObj.width);
        var othertop = otherObj.y;
        var otherbottom = otherObj.y + (otherObj.height);
        var crash = true;
        if ((mybottom < othertop) ||
                (mytop > otherbottom) ||
                (myright < otherleft) ||
                (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function indexToCoord(index, spriteW, spriteH, row, col) {
    var r = Math.floor(index / col);
    var c = index % col;

    return [c * spriteW, r * spriteH];
}

function Hero(width, height, runSpriteSheet, jumpSpriteSheet, attackSpriteSheet, x, y, gameArea) {
    this.width = width;
    this.height = height;
    this.jumpContactTimeY = 50; // contact time, in miliseconds, of the jump impact.
    this.jumpContactTimeX = 120; // contact time, in miliseconds, of the jump impact.
    this.jumpContactTimerY = 0;
    this.jumpContactTimerX = 0;
    this.jumpAccelerateY = -18000;
    this.jumpAccelerateX = 1000;
    this.jumpSpeedX = 100;
    this.gravityAccelerate = 3000;
    this.rightLimit = gameArea.canvas.width - this.width;
    this.leftLimit = 0;
    this.botLimit = gameArea.gameLogic.groundY - this.height;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.accelerateX = 0;
    this.accelerateY = this.gravityAccelerate;

    this.speedUpDuration = 5000; // Duration of the speed up special move in milliseconds.
    this.speedUpForwardDist = 100; // Pixel distance
    this.speedUpCooldown = 3000;
    this.speedUpAmount = 100;
    this.speedUpReady = true;

    this.ammo = 3;
    this.deathCountMin = 1;
    this.deathCountMax = 3;
    this.attackCooldown = 600;
    this.attackReady = true;

    this.runSpriteSheet = runSpriteSheet;
    this.jumpSpriteSheet = jumpSpriteSheet;
    this.attackSpriteSheet = attackSpriteSheet;

    this.activeSpriteSheet = runSpriteSheet;
    this.activeSpriteSheetRow = 2;
    this.activeSpriteSheetCol = 4;
    this.activeSpriteSheetMaxIndex = 8;
    this.spriteDeltaTime = 1000 / 12;
    this.animeTimeAcc = 0;
    this.spriteIndex = 0;
    this.spriteSrcCoord = [0, 0];

    this.render = function(deltaTime) {
        this.animeTimeAcc += deltaTime;
        if (this.animeTimeAcc >= this.spriteDeltaTime) {
            this.animeTimeAcc = 0;
            this.spriteIndex += 1;
            if ((this.activeSpriteSheet == this.jumpSpriteSheet || this.activeSpriteSheet == this.attackSpriteSheet) && this.spriteIndex == this.activeSpriteSheetMaxIndex){
                this.spriteIndex = 0;
                this.activeSpriteSheet = this.runSpriteSheet;
                this.activeSpriteSheetRow = 2;
                this.activeSpriteSheetCol = 4;
                this.activeSpriteSheetMaxIndex = 8;
            } else {
                this.spriteIndex %= this.activeSpriteSheetMaxIndex;
            }
            this.spriteSrcCoord = indexToCoord(this.spriteIndex, this.width, this.height, this.activeSpriteSheetRow, this.activeSpriteSheetCol);
        }
        var ctx = gameArea.context;
        ctx.drawImage(this.activeSpriteSheet, this.spriteSrcCoord[0], this.spriteSrcCoord[1], this.width, this.height, this.x, this.y, this.width, this.height);
    }
    this.clear = function() {
        var ctx = gameArea.context;

        ctx.clearRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    }
    // Update position
    this.updatePos = function() {
        // Determine if jumping or not
        if (this.jumpContactTimerX > 0) {
            this.jumpContactTimerX -= gameArea.deltaTime;
            this.accelerateX = this.jumpAccelerateX;
        } else {
            // if in air, apply horizontal air drag
            if (this.y < this.botLimit) {
                this.accelerateX = -gameArea.gameLogic.airDragAcc;
            } else {
                this.accelerateX = 0;
                this.speedX = 0;
            }
        }
        if (this.jumpContactTimerY > 0) {
            this.jumpContactTimerY -= gameArea.deltaTime;
            this.accelerateY = this.jumpAccelerateY;
        } else {
            this.accelerateY = this.gravityAccelerate;
        }
        // Update speed
        this.speedX = this.speedX + this.accelerateX * gameArea.deltaTime / (1000 * (gameArea.gameLogic.heroSpeedX / gameArea.gameLogic.heroSpeedXInit));
        this.speedY = this.speedY + this.accelerateY * gameArea.deltaTime / 1000;
        // Update position
        var newX = this.x + this.speedX * gameArea.deltaTime/ 1000;
        var newY = this.y + this.speedY * gameArea.deltaTime/ 1000;
        this.x = clip(newX, this.leftLimit, this.rightLimit);
        this.y = Math.min(this.botLimit, newY);
        if (this.y >= this.botLimit) {
            this.speedY = 0;
        }
    }
    this.setJumpContactTimerXCallback = function(heroEntity) {
        return function() {heroEntity.jumpContactTimerX = heroEntity.jumpContactTimeX;};
    }
    this.jump = function() {
        if (this.y >= this.botLimit) {
            this.jumpContactTimerY = this.jumpContactTimeY;
            // Delaying jumping forward
            setTimeout(this.setJumpContactTimerXCallback(this), 70);
            this.activeSpriteSheet = this.jumpSpriteSheet;
            this.activeSpriteSheetRow = 3;
            this.activeSpriteSheetCol = 4;
            this.activeSpriteSheetMaxIndex = 11;
            this.spriteIndex = 0;
            //this.jumpContactTimerX = this.jumpContactTimeX;
        }
    }

    this.speedUpCoolDownEndCallback = function(heroEntity) {
        return function() {
            heroEntity.speedUpReady = true;
        }
    }

    this.speedUpEndCallback = function(heroEntity) {
        return function() {
            heroEntity.speedX = 0;
            gameArea.gameLogic.heroSpeedX -= heroEntity.speedUpAmount;
            setTimeout(heroEntity.speedUpCoolDownEndCallback(heroEntity), heroEntity.speedUpCooldown);
        }
    }

    this.speedUp = function() {
        if (this.speedUpReady) {
            this.speedUpReady = false;
            this.speedX = this.speedUpForwardDist * gameArea.deltaTime / this.speedUpDuration;
            gameArea.gameLogic.heroSpeedX += this.speedUpAmount;
            setTimeout(this.speedUpEndCallback(this), this.speedUpDuration);
        }
    }

    this.setAttackReadyCallback = function(heroEntity) {
        return function() {heroEntity.attackReady = true;};
    }
    this.attack = function(zombies) {
        if (this.ammo > 0 && this.attackReady && this.y >= this.botLimit) {
            this.attackReady = false;
            var deathCount = this.deathCountMin + Math.floor(Math.random() * (this.deathCountMax - this.deathCountMin));
            for (var i = 0; i < deathCount; i += 1) {
                zombies.pop();
            }
            this.ammo -= 1;
            setTimeout(this.setAttackReadyCallback(this), this.attackCooldown);
            this.activeSpriteSheet = this.attackSpriteSheet;
            this.activeSpriteSheetRow = 2;
            this.activeSpriteSheetCol = 4;
            this.activeSpriteSheetMaxIndex = 8;
            this.spriteIndex = 0;
        }
    }

    this.crashWith = function(otherObj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherObj.x;
        var otherright = otherObj.x + (otherObj.width);
        var othertop = otherObj.y;
        var otherbottom = otherObj.y + (otherObj.height);
        var crash = true;
        if ((mybottom < othertop) ||
                (mytop > otherbottom) ||
                (myright < otherleft) ||
                (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

var hero;
var background;
var obstacles = [];
var obstaclesToJump = [];
var zombies = [];
// Game states = ["ParkourMode", "ZombieWait", "ZombieSpawn", "ZombieMode", "ShiftAnimation"]
var gameState;
var ObstacleSpawn;
var ZombieSpawn;
// In miliseconds
var obstacleIntervalMin = 1200;
var obstacleIntervalMax = 6000;
var zombieIntervalMin = 300;
var zombieIntervalMax = 1000;
var obstacleSpawnAmountPerLevel = 1;

var level = 1;
var maxLevel = 10;
var zombieWaitDuration = 10000;
var zombieModeDuration = 30000;
// avoid 3 obstacles = ammo + 1
var obstacleAvidScore = 0;

var score = 0;

var heroBaseSpeed = 200;
var heroSpeedUpAmount = 50;

var zombieBaseSpeed = 260;
var zombieSpeedUpAmount = 60;

var shiftAnimationDuration = 300;
var shiftAnimationAmount;

var heroController = {
    reactionTime: 120,   // Time, in miliseconds, needed to build up an action.
    coolDownTime: 80,  // Time, in miliseconds, needed to separate two consecutive executions of an action.
    buildUpTimer: 0,    // Time, in miliseconds, since an action starts building up.
    coolDownTimer: 0,   // Time, in miliseconds, since an action is executed.
    keyReleased: true,  // If the key is released and the action is ready to build up.

    //states = ["buildUP", "coolDown"];
    //keyEvents = ["Down", "Up", "None"];
    state : "buildUp",
    invoke: function(deltaTime, keyEvent, entity) {
        if (this.state == "buildUp"){
            if (keyEvent == "Down") {
                this.buildUpTimer = this.buildUpTimer + deltaTime;
            } else if (keyEvent == "Up") {
                this.buildUpTimer = 0;
                this.keyReleased = true;
            }
            if (this.buildUpTimer >= this.reactionTime && this.keyReleased) {
                entity.jump();
                this.buildUpTimer = 0;
                this.state = "coolDown";
            }
        } else if (this.state == "coolDown") {
            if (keyEvent == "Up") {
                this.keyReleased = true;
            }
            this.coolDownTimer = this.coolDownTimer + deltaTime;
            if (this.coolDownTimer >= this.coolDownTime) {
                this.coolDownTimer = 0;
                this.state = "buildUp";
            }
        } else {
            console.log("ERROR!");
        }
    }
};

function heroSpeed(level) {
    return heroBaseSpeed + Math.min(level - 1, 9) * heroSpeedUpAmount;
}

function zombieSpeed(level) {
    return zombieBaseSpeed + Math.min(level - 1, 9) * zombieSpeedUpAmount;
}

function ObstacleSpawn(obstacles, obstaclesToJump, gameArea, intervalMin, intervalMax, spriteSheet) {
    this.spawnCount = 0;
    this.obstacles = obstacles;
    this.intervalMin = intervalMin;
    this.intervalMax = intervalMax;
    this.nextReady = true;

    this.spawn = function() {
        if (this.nextReady) {
            this.nextReady = false;
            var interval = this.intervalMin + Math.floor(Math.random() * (this.intervalMax - this.intervalMin));
            setTimeout(this.spawnObstacleCallback(this), interval);
        }
    };
    this.spawnObstacleCallback = function(obstacleSpawn) {
        return function() {
            var width = 32;
            var height = 160;
            var x = gameArea.canvas.width;
            var y = gameArea.gameLogic.groundY - height;
            var obstacle = new Obstacle(width, height, spriteSheet, x, y, gameArea, obstacles);
            obstacles.unshift(obstacle);
            obstaclesToJump.push(obstacle);
            obstacleSpawn.spawnCount += 1;
            obstacleSpawn.nextReady = true;
        }
    };
}

// Spawn a horde of zombies
function ZombieSpawn(zombies, gameArea, hero, intervalMin, intervalMax, runSpriteSheet) {
    this.spawn = function(number, speedX) {
        this.numZombieToSpawn = number;
        this.speedX = speedX;
        this.spawnZombieCallback(this)();
    }
    this.spawnZombieCallback = function(zombieSpawn) {
        return function() {
            if (zombieSpawn.numZombieToSpawn > 0) {
                var width = 80;
                var height = 96;
                var x = -width;
                var y = gameArea.gameLogic.groundY - height;
                zombies.unshift(new Zombie(width, height, runSpriteSheet, x, y, zombieSpawn.speedX, gameArea, zombies, hero));
                zombieSpawn.numZombieToSpawn -= 1;
                var interval = intervalMin + Math.floor(Math.random() * (intervalMax - intervalMin));
                setTimeout(zombieSpawn.spawnZombieCallback(zombieSpawn), interval);
            }
        }
    }
}

function heroSpeedUpCallback(gameArea, speedUpAmount) {
    return function() {
        gameArea.gameLogic.heroSpeedX += speedUpAmount;
    };
}



function updateAllPositions() {
    foreground.updatePos();
    for (i = obstacles.length - 1; i >= 0; i -= 1) {
        obstacles[i].updatePos();
    }
    hero.updatePos();
    for (i = zombies.length - 1; i >= 0; i -= 1) {
        zombies[i].updatePos();
    }
}

function invokeController() {
    if (myGameArea.key) {
        if (myGameArea.key == 38) {
            heroController.invoke(myGameArea.deltaTime, "Down", hero);
        } else if (myGameArea.key == 82) {
            // Speedup
            heroController.invoke(myGameArea.deltaTime, "Up", hero);
            hero.speedUp();
        } else if (myGameArea.key == 32) {
            // Attack
            heroController.invoke(myGameArea.deltaTime, "Up", hero);
            hero.attack(zombies);
        }
    } else {
        heroController.invoke(myGameArea.deltaTime, "Up", hero);
    }
}

function detectCameraShift(returnState) {
    if ((hero.x < myGameArea.gameLogic.heroFocusLeft || hero.x > myGameArea.gameLogic.heroFocusRight) && hero.y >= hero.botLimit) {
        shiftAnimationAmount = (myGameArea.canvas.width / 2) - hero.x;
        gameState = "ShiftAnimation";
        setTimeout(function() { gameState = returnState; }, shiftAnimationDuration);
    }
}

function displayFrameRate() {
    var gameStatString = `FPS: ${myGame.frameRate}`;
    $("#game_stat").text(gameStatString);
}

//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
//Function to check whether a point is inside a rectangle
function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y
}


var myGame = {
    lastTimeStamp: false,
    accumulator: 0,
    zombieWaitTimer: 0,
    startGame: function() {
        myGameArea.start();
        var heroRunSpriteSheet = new Image();
        var heroJumpSpriteSheet = new Image();
        var heroAttackSpriteSheet = new Image();
        heroRunSpriteSheet.src = "static/HeroRun.png";
        heroJumpSpriteSheet.src = "static/HeroJump.png";
        heroAttackSpriteSheet.src = "static/HeroAttack.png";
        hero = new Hero(72, 96, heroRunSpriteSheet, heroJumpSpriteSheet, heroAttackSpriteSheet, myGameArea.canvas.width / 2, 20, myGameArea);
        var fgImage = new Image();
        fgImage.src = "static/Ground.png";
        foreground = new Foreground(fgImage, myGameArea);
        //fgImage.onload = function() {
        //    myGameArea.fgContext.drawImage(fgImage, 0, myGameArea.gameLogic.groundY);
        //};
        var spriteSheet = new Image();
        spriteSheet.src = "static/Wall01.png";
        ObstacleSpawn = new ObstacleSpawn(obstacles, obstaclesToJump, myGameArea, obstacleIntervalMin, obstacleIntervalMax, spriteSheet);
        var zombieRunSpriteSheet = new Image();
        zombieRunSpriteSheet.src = "static/ZombieRun.png";
        ZombieSpawn = new ZombieSpawn(zombies, myGameArea, hero, zombieIntervalMin, zombieIntervalMax, zombieRunSpriteSheet);
        gameState = "ParkourMode";
        //setInterval(heroSpeedUpCallback(myGameArea, heroSpeedUpAmount), heroSpeedUpInterval);
        setInterval(displayFrameRate, 500);
    },

    updateGame : function(timestamp) {
        for (i = 0; i < obstacles.length; i += 1) {
            obstacles[i].clear();
        }
        hero.clear();
        for (i = 0; i < zombies.length; i += 1) {
            zombies[i].clear();
        }
        myGameArea.context.clearRect(500, 50, 500, 150);
        if (!myGame.lastTimeStamp) {
            myGame.lastTimeStamp = timestamp;
        }

        var frameDeltaTime = timestamp - myGame.lastTimeStamp;
        myGame.lastTimeStamp = timestamp;
        // TODO: Remove debug
        myGame.frameRate = 1000 / frameDeltaTime;

        myGame.accumulator += frameDeltaTime;

        while (myGame.accumulator >= myGameArea.deltaTime) {
            var terminate = myGame.updateGameLogic(frameDeltaTime);
            if (terminate) {
                var gameOverString = `You died! \nFinal Score: ${score}`;
                myGameArea.context.font = "40px Georgia";
                myGameArea.context.fillStyle = "red";
                myGameArea.context.fillText(gameOverString, 300, 300);
                return;
            }
            myGame.accumulator -= myGameArea.deltaTime;
        }

        // Render
        foreground.render();
        for (i = 0; i < obstacles.length; i += 1) {
            obstacles[i].render();
        }
        hero.render(frameDeltaTime);
        for (i = 0; i < zombies.length; i += 1) {
            zombies[i].render(frameDeltaTime);
        }
        var statString = `Ammo: ${hero.ammo}\nScore: ${score}\nLevel: ${level}`;
        myGameArea.context.fillText(statString, 600, 100);
        window.requestAnimationFrame(myGame.updateGame);
    },

    updateGameLogic : function(deltaTime) {
        if (gameState == "ParkourMode") {
            // Proceed to Zombie mode
            if (ObstacleSpawn.spawnCount >= obstacleSpawnAmountPerLevel) {
                ObstacleSpawn.spawnCount = 0;
                setTimeout(function() {
                    gameState = "ParkourMode";
                    level += 1;
                    myGameArea.gameLogic.heroSpeedX = heroSpeed(level);
                }, zombieModeDuration);
                gameState = "ZombieWait";
            }
            // Spawn obstacles
            ObstacleSpawn.spawn();

            invokeController();

            // Update game state
            updateAllPositions();

            detectCameraShift("ParkourMode");

        } else if (gameState == "ZombieWait") {
            invokeController();

            updateAllPositions();

            detectCameraShift("ZombieWait");

            // Proceed to zombie mode when no obstacles left on screen
            if (obstacles.length == 0 && myGame.zombieWaitTimer >= zombieWaitDuration) {
                myGame.zombieWaitTimer = 0;
                gameState = "ZombieSpawn";
            } else {
                myGame.zombieWaitTimer += deltaTime
            }
        } else if (gameState == "ZombieSpawn") {
            ZombieSpawn.spawn(10, zombieSpeed(level));

            invokeController();

            updateAllPositions();

            detectCameraShift("ZombieMode");

            gameState = "ZombieMode";
        } else if (gameState == "ZombieMode") {

            invokeController();

            updateAllPositions();

            detectCameraShift("ZombieMode");
        } else if (gameState == "ShiftAnimation") {
            hero.updatePos();
            shiftAnimationAmountPerFrame = shiftAnimationAmount / (shiftAnimationDuration / myGameArea.deltaTime);
            hero.x += shiftAnimationAmountPerFrame;
            for (i = obstacles.length - 1; i >= 0; i -= 1) {
                obstacles[i].x += shiftAnimationAmountPerFrame;
            }
            for (i = zombies.length - 1; i >= 0; i -= 1) {
                zombies[i].x += shiftAnimationAmountPerFrame;
            }
        }

        // Detect if get caught by zombie
        for (i = 0; i < zombies.length; i += 1) {
            if (hero.crashWith(zombies[i])) {
                return true;
            }
        }
        // Detect obstacle collision
        for (i = 0; i < obstacles.length; i += 1) {
            if (hero.crashWith(obstacles[i])) {
                obstacles[i].collided = true;
            }
        }
        for (i = 0; i < zombies.length; i += 1) {
            for (j = 0; j < obstacles.length; j += 1) {
                if (zombies[i].crashWith(obstacles[j])) {
                    zombies[i].speedX = 0;
                }
            }
        }

        if (obstaclesToJump.length > 0) {
            var obstacle = obstaclesToJump[0];
            if (obstacle.x < hero.x) {
                if (!obstacle.collided) {
                    obstacleAvidScore += 1;
                    if (obstacleAvidScore == 3) {
                        hero.ammo += 1;
                        obstacleAvidScore = 0;
                    }
                } else {
                    score -= 100;
                }
                obstaclesToJump.shift();
            }
        }

        // Update game stats
        score += 1;
    },
    displayMenu: function() {
        this.menuCanvas = document.createElement("canvas");
        this.menuCanvas.width = 1000;
        this.menuCanvas.height = 600;
        this.menuContext = this.menuCanvas.getContext('2d');
        this.backgroundImage = new Image();
        this.backgroundImage.src = "static/Background2.png";
        this.buttonImage = new Image();
        this.buttonImage.src = "static/StartButton.png";
        document.body.insertBefore(this.menuCanvas, document.body.childNodes[0]);
        //Binding the click event on the canvas
        this.buttonRect = {
            x:400,
            y:400,
            width:200,
            height:60
        };
        this.menuCanvas.addEventListener('click', (function(funcObj) {
            return function(evt) {
                var mousePos = getMousePos(funcObj.menuCanvas, evt);
                if (isInside(mousePos, funcObj.buttonRect)) {
                    funcObj.menuCanvas.parentNode.removeChild(funcObj.menuCanvas);
                    myGame.startGame();
                }
            }
        })(this), false);
        this.menuContext.drawImage(this.backgroundImage, 0, 0);
        this.menuContext.drawImage(this.buttonImage, this.buttonRect.x, this.buttonRect.y);
    }
}


socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('connect', function() {
    socket.emit('client_connected', {data: 'New client!'});
});

socket.on('message', function (data) {
    console.log('message form backend ' + data);
});

socket.on("ACC_DATA_SERVER", function(data) {
    console.log("Acc data received from server " + data);
    socket.emit("ACC_DATA_CLIENT", data);
});

var label_to_class_names = {0:"Jump", 1:"Run", 2:"LeanLeft", 3:"LeanRight", 4:"TurnAround", 5:"Idle"}
socket.on("classification_server", function(data) {
    var label = data["label"];
    var label_text = "";
    if(label == 0)
    {
        label_text = "Jump";
        hero.jump();
    }
    else if(label == 1)
    {
        label_text = "Run";
    }
    else if(label == 2)
    {
        label_text = "TurnAround";
    }
    else if(label == 3)
    {
        label_text = "Idle";
    }
    else if(label == 4)
    {
        label_text = "TurnAround";
    }
    else if(label == 5)
    {
        label_text = "Idle";
    }
    console.log("LABEL!! " + label_text);

    $("#class1").text(label_text);
});

function json_button() {
    socket.send('{"message": "test"}');
}
$(document).ready(function(){
    //myGame.startGame();
    myGame.displayMenu();
});
