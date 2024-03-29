const canvas = document.getElementById("myCanvas");
canvas.height = window.innerHeight;
canvas.width = 200;

let startTime = Date.now();

const maxFrameRate = 144;
let frameRate = 144;
const slowRate = 4;
let showDebug = true;

const generationText = document.getElementById("generation");
const fitnessText = document.getElementById("fitness");
const bestFitnessText = document.getElementById("best-fitness");
const distanceText = document.getElementById("distance");
const mutationText = document.getElementById("mutation");
const speedText = document.getElementById("speed");
const radiusText = document.getElementById("radius");
const timeText = document.getElementById("time");

const ctx = canvas.getContext("2d");
let generation = 1;

const road = new Road(canvas.width/2, canvas.width * 0.90);
const numTraffic = 100;
let initialPos = 50;

let n = 100;
let mutationRate = 0.1;

let damagedCars = 0;
let timeElapsed = 0;
let distance = 0;

const cars = generateCars(n);
let bestCar = cars[0];

if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(
            localStorage.getItem("bestBrain")
        );
        if (i != 0) {
            NeuralNetwork.mutate(cars[i].brain, mutationRate);
        }
    }
}
if (localStorage.getItem("generation")) {
    generation = localStorage.getItem("generation");
}

const traffic = [];

addTraffic();
animate();

function addTraffic() {
    for (let i = 0; i < numTraffic; i++) {
        const random = Math.random();
        initialPos -= Math.floor(Math.random() * (275 - 150 + 1) + 150);
        if (random < 0.75) {
            let randomLane = Math.floor(Math.random() * 4.5);
            traffic.push(new Car(road.getLaneCenter(randomLane >= 2 ? 2 : randomLane), initialPos, 30, 50, "DUMMY", 2, getRandomColor(), Math.random() >= 0.1 ? "car" : "truck"));
        } else {
            let randomLane = Math.floor(Math.random() * 4.5);
            traffic.push(new Car(road.getLaneCenter(randomLane), initialPos, 30, 50, "DUMMY", 2, getRandomColor(), Math.random() >= 0.1 ? "car" : "truck"));
            traffic.push(new Car(road.getLaneCenter(randomLane < 2 ? randomLane + 1 : 0), initialPos, 30, 50, "DUMMY", 2, getRandomColor(), randomLane == 1 ? "car" : Math.random() >= 0.1 ? "car" : "truck"));
        }
    }
}

function averageFitness() {
    let tempFit = 0;
    for (let i = 0; i < cars.length; i++) {
        tempFit += cars[i].fitness;
    }
    return parseInt(tempFit / cars.length);
}

function averageSpeed() {
    let tempSpeed = 0;
    for (let i = 0; i < cars.length; i++) {
        tempSpeed += cars[i].speed;
    }
    return parseInt(tempSpeed / cars.length);
}

function checkDamaged() {
    damagedCars = 0;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].damaged) {
            damagedCars += 1;
        }
    }
    if (damagedCars >= cars.length && timeElapsed > 0) {
        save();
        location.reload();
        mutationRate = (mutationRate == 0.1) ? 0.2 : 0.1;
    }
    
}

function save() {
    localStorage.setItem(
        "bestBrain", 
        JSON.stringify(bestCar.brain)
        );
        localStorage.setItem(
            "generation",
            parseInt(generation) + 1
            );
            document.getElementById("bestBrain").value = JSON.stringify(bestCar.brain, null, "\t");
    location.reload();
}

function discard() {
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("generation");
    location.reload();
}

function email() {
    save();
    document.forms["email-brain"].submit(); 
}

function debugShow() {
    showDebug = !showDebug;
}


function generateCars(n) {
    const cars = [];
    for (let i = 0; i < n; i++) {
        cars.push(new Car(
            road.getLaneCenter(1),
            0,
            30,
            50,
            "AI"
        ));
    }
    return cars;
}
    
function animate() {
    setTimeout(function() { 
        checkDamaged();
            
        for (let i = 0; i < traffic.length; i++) {
            traffic[i].update(road.borders, []);
        }
        for (let i = 0; i < cars.length; i++) {
            cars[i].update(road.borders, traffic);
            cars[i].calculateFitness(road, traffic);
        }       
            
        bestCar = cars.find(
            c => c.fitness == Math.max(...cars.map(c => c.fitness))
        );
                
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].y > bestCar.y + 200) {
                cars[i].damaged = true;
            }
        }   
                
        canvas.height = window.innerHeight;
                
        ctx.save()
        ctx.translate(0, -bestCar.y + canvas.height * 0.80);
            
        road.draw(ctx);
        for (let i = 0; i < traffic.length; i++) {
            traffic[i].draw(ctx);
        }
            
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < cars.length; i++) {
            cars[i].draw(ctx);
        }
        ctx.globalAlpha = 1;
        bestCar.draw(ctx, showDebug, true, true);
            
        ctx.restore();
            
        generationText.innerHTML = generation;
        fitnessText.innerHTML = averageFitness();
        bestFitnessText.innerHTML = parseInt(bestCar.fitness);
            
        distance = Math.abs(bestCar.y * (1.644 * Math.pow(10, -7)));
        distanceText.innerHTML = parseFloat(distance).toFixed(4) + "mi";
        mutationText.innerHTML = mutationRate + " (" + mutationRate * 100 + "%)";
        speedText.innerHTML = bestCar.maxSpeed;
        radiusText.innerHTML = bestCar.radius;

        timeElapsed = (Date.now() - startTime) / 1000;
        timeText.innerHTML = parseInt(timeElapsed) + "s (" + frameRate + "fps)";
            
        requestAnimationFrame(animate);
    }, timeElapsed != 0 ? (1000 / frameRate) : 0);
}
    
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        debugShow();
    } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        save();
    } else if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        discard();
    } else if (e.ctrlKey && e.key === '4') {
        e.preventDefault();
        email();
    } else if (e.keyCode == 32) {
        frameRate = maxFrameRate / slowRate;
    }
});

document.addEventListener('keyup', e => {
    if (e.keyCode == 32) {
        frameRate = maxFrameRate;
    }
});

document.getElementById("copyright").innerHTML = "Copyright &copy" + new Date().getFullYear() + " Tegan Hakim | Tyler Lumpkin";