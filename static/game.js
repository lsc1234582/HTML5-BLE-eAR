var myGameArea = {
    canvas : document.createElement("canvas"),
    //backgroundImage: new Image(),
    start : function() {
        this.canvas.width = 1000;
        this.canvas.height = 600;
        //this.backgroundImage.src = "images/mountains2.png";
        this.gameLogic = {
            groundY : 450,
            heroSpeedXInit : 150,
            // heroSpeedX is required in many different component, thus global
            heroSpeedX : 150,
            // the area that the hero is allowed to be in
            heroFocusLeft: 300,
            heroFocusRight: 700,
            airDragAcc : 80
        };
        this.context = this.canvas.getContext("2d");
        this.deltaTime = 20;
        this.frames = 1000 / this.deltaTime;
        // frame number counter, could overflow but not a problem when only
        // used to spawn obstacles and zombines
        this.frameNo = 0;
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGame, this.deltaTime);
        window.addEventListener("keydown", function (e) {
            myGameArea.key = e.keyCode;
        });
        window.addEventListener("keyup", function (e) {
            myGameArea.key = false;
        });
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //this.context.drawImage(this.backgroundImage, 0, 0);
    },
    clear : function(){
        this.context.fillStyle = "blue";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //this.context.drawImage(this.backgroundImage, 0, 0);
        //this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {
        clearInterval(this.interval);
    }
};

function clip(x, min, max){
    return Math.min(max, Math.max(min, x))
}

function everyInterval(n) {
    return ((myGameArea.frameNo % n) == 0);
}

//function Background(imageSource, scrollSpeed, gameArea) {
//    this.width = gameArea.canvas.width;
//    this.x1 = 0;
//    this.x2 = this.width;
//    this.y = 0;
//    this.scrollSpeed = scrollSpeed;
//    this.gameArea = gameArea;
//    this.image1 = new Image();
//    this.image2 = new Image();
//    this.image1.src = imageSource;
//    this.image2.src = imageSource;
//    this.updatePos = function() {
//        var scrollAmount = this.scrollSpeed / this.gameArea.frames;
//        this.x1 -= scrollAmount;
//        this.x2 -= scrollAmount;
//        if (this.x1 <= -this.width) {this.x1 = this.width;}
//        if (this.x2 <= -this.width) {this.x2 = this.width;}
//    }
//    this.render = function() {
//        this.gameArea.context.drawImage(this.image1, this.x1, this.y);
//        this.gameArea.context.drawImage(this.image2, this.x2, this.y);
//    }
//}

function Obstacle(width, height, color, x, y, gameArea, obstacles) {
    this.width = width;
    this.height = height;
    this.gameArea = gameArea;

    this.x = x;
    this.y = y;
    this.leftLimit = - this.width;
    this.rightLimit = gameArea.canvas.width;
    this.speedX = - gameArea.gameLogic.heroSpeedX;
    this.render = function() {
        ctx = this.gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // Update position
    this.updatePos = function() {
        // Update position
        //console.log("obstacles length " + obstacles.length);
        this.x = this.x + this.speedX / this.gameArea.frames;
        // Obstacles only travels in one direction. Suffices to only check against left limit
        // Remove itself from the obstacles array when going out of limits
        if (this.x <= this.leftLimit) {
            obstacles.splice(obstacles.indexOf(this), 1);
        }
    }
}

function Hero(width, height, color, x, y, gameArea) {
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
    this.gameArea = gameArea;
    this.rightLimit = this.gameArea.canvas.width - this.width;
    this.leftLimit = 0;
    this.botLimit = this.gameArea.gameLogic.groundY - this.height;

    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.accelerateX = 0;
    this.accelerateY = this.gravityAccelerate;
    this.render = function() {
        ctx = this.gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // Update position
    this.updatePos = function() {
        //console.log("speedY " + this.speedY);
        //console.log("accX " + this.accelerateX);
        // Determine if jumping or not
        if (this.jumpContactTimerX > 0) {
            this.jumpContactTimerX -= this.gameArea.deltaTime;
            this.accelerateX = this.jumpAccelerateX;
            //this.speedX = this.jumpSpeedX;
        } else {
            // if in air, apply horizontal air drag
            if (this.y < this.botLimit) {
                this.accelerateX = -this.gameArea.gameLogic.airDragAcc;
            } else {
                this.accelerateX = 0;
                this.speedX = 0;
            }
        }
        if (this.jumpContactTimerY > 0) {
            this.jumpContactTimerY -= this.gameArea.deltaTime;
            this.accelerateY = this.jumpAccelerateY;
        } else {
            this.accelerateY = this.gravityAccelerate;
        }
        // Update speed
        this.speedX = this.speedX + this.accelerateX / (this.gameArea.frames * (this.gameArea.gameLogic.heroSpeedX / this.gameArea.gameLogic.heroSpeedXInit));
        this.speedY = this.speedY + this.accelerateY / this.gameArea.frames;
        // Update position
        var newX = this.x + this.speedX / this.gameArea.frames;
        var newY = this.y + this.speedY / this.gameArea.frames;
        this.x = clip(newX, this.leftLimit, this.rightLimit);
        this.y = Math.min(this.botLimit, newY);
        if (this.y >= this.botLimit) {
            this.speedY = 0;
        }
    }
    this.setJumpContactTimerX = function(heroEntity) {
        return function() {heroEntity.jumpContactTimerX = heroEntity.jumpContactTimeX;};
    }
    this.jump = function() {
        if (this.y >= this.botLimit) {
            this.jumpContactTimerY = this.jumpContactTimeY;
            // Delaying jumping forward
            setTimeout(this.setJumpContactTimerX(this), 70);
            //this.jumpContactTimerX = this.jumpContactTimeX;
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
        var crash = false;
        if ((mybottom < othertop) ||
                (mytop > otherbottom) ||
                (myright < otherleft) ||
                (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
    this.forward = function() {
        this.speedX = 20;
    }
    this.backward = function() {
        this.speedX = -20;
    }
}

var hero;
var background;
var obstacles = [];
var zombines = [];
// Game states = ["ParkourMode", "ZombieMode", "ShiftAnimation"]
var gameState;
var obstacleSpawn;
// In miliseconds
var shiftAnimationDuration = 500;
var shiftAnimationAmount;
var obstacleIntervalMin = 1200;
var obstacleIntervalMax = 6000;
var heroSpeedUpAmount = 50;
var heroSpeedUpInterval = 10000;

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
            //console.log("buildUpTime" + this.buildUpTimer);
            if (keyEvent == "Down") {
                this.buildUpTimer = this.buildUpTimer + deltaTime;
            } else if (keyEvent == "Up") {
                this.buildUpTimer = 0;
                this.keyReleased = true;
            }
            if (this.buildUpTimer >= this.reactionTime && this.keyReleased) {
                //console.log("execute");
                entity.jump();
                this.buildUpTimer = 0;
                this.state = "coolDown";
            }
        } else if (this.state == "coolDown") {
            //console.log("coolDown");
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

function ObstacleSpawn(obstacles, gameArea, intervalMin, intervalMax) {
    this.obstacles = obstacles;
    this.gameArea = gameArea;
    this.intervalMin = intervalMin;
    this.intervalMax = intervalMax;
    this.nextReady = true;

    this.spawn = function() {
        if (this.nextReady) {
            this.nextReady = false;
            var interval = obstacleIntervalMin + Math.floor(Math.random() * (obstacleIntervalMax - obstacleIntervalMin));
            setTimeout(this.spawnObstacleCallback(this), interval);
        }
    };
    this.spawnObstacleCallback = function(obstacleSpawn) {
        return function() {
            var width = 25;
            var height = 150;
            var x = obstacleSpawn.gameArea.canvas.width;
            var y = obstacleSpawn.gameArea.gameLogic.groundY - height;
            obstacleSpawn.obstacles.unshift(new Obstacle(width, height, "gray", x, y, obstacleSpawn.gameArea, obstacleSpawn.obstacles));
            obstacleSpawn.nextReady = true;
        }
    };
}

function heroSpeedUpCallback(gameArea, speedUpAmount) {
    return function() {
        gameArea.gameLogic.heroSpeedX += speedUpAmount;
    };
}


function startGame() {
    myGameArea.start();
    hero = new Hero(35, 90, "red", myGameArea.canvas.width / 2, 20, myGameArea);
    //background = new Background("images/mountains2.png", 50, myGameArea);
    obstacleSpawn = new ObstacleSpawn(obstacles, myGameArea, obstacleIntervalMin, obstacleIntervalMax);
    gameState = "ParkourMode";
    //setInterval(heroSpeedUpCallback(myGameArea, heroSpeedUpAmount), heroSpeedUpInterval);
}

function updateGame() {
    //console.log(gameState);
    // Main loop
    myGameArea.clear();
    myGameArea.frameNo += 1;
    // Render
    //background.render();
    for (i = 0; i < obstacles.length; i += 1) {
        obstacles[i].render();
    }
    hero.render();
    // Detect collision
    for (i = 0; i < obstacles.length; i += 1) {
        if (hero.crashWith(obstacles[i])) {
            myGameArea.stop();
            return;
        }
    }
    if (gameState == "ParkourMode") {
        // Spawn obstacles
        obstacleSpawn.spawn();
        //if (myGameArea.keyUp && myGameArea.keyUp == 37) {hero.backward(); }
        //if (myGameArea.keyUp && myGameArea.keyUp == 39) {hero.forward(); }
        if (myGameArea.key && myGameArea.key == 38) {
            heroController.invoke(myGameArea.deltaTime, "Down", hero);
        } else {
            heroController.invoke(myGameArea.deltaTime, "Up", hero);
        }
        // Update game state
        //background.updatePos();
        for (i = obstacles.length - 1; i >= 0; i -= 1) {
            obstacles[i].updatePos();
        }
        hero.updatePos();
        if ((hero.x < myGameArea.gameLogic.heroFocusLeft || hero.x > myGameArea.gameLogic.heroFocusRight) && hero.y >= hero.botLimit) {
            shiftAnimationAmount = (myGameArea.canvas.width / 2) - hero.x;
            gameState = "ShiftAnimation";
            setTimeout(function() { gameState = "ParkourMode"; }, shiftAnimationDuration);
        }
    } else if (gameState == "ShiftAnimation") {
        // Spawn obstacles
        //if (myGameArea.key && myGameArea.key == 38) {
        //    heroController.invoke(myGameArea.deltaTime, "Down", hero);
        //} else {
        //    heroController.invoke(myGameArea.deltaTime, "Up", hero);
        //}
        //background.updatePos();
        //for (i = obstacles.length - 1; i >= 0; i -= 1) {
        //    obstacles[i].updatePos();
        //}
        hero.updatePos();
        shiftAnimationAmountPerFrame = shiftAnimationAmount / (shiftAnimationDuration / myGameArea.deltaTime);
        hero.x += shiftAnimationAmountPerFrame;
        for (i = obstacles.length - 1; i >= 0; i -= 1) {
            obstacles[i].x += shiftAnimationAmountPerFrame;
        }
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
    startGame();
});
