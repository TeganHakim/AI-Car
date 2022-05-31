const canvas = document.getElementById("myCanvas");
canvas.height = window.innerHeight;
canvas.width = 200;

const generationText = document.getElementById("generation");
const fitnessText = document.getElementById("fitness");
const bestFitnessText = document.getElementById("best-fitness");

const ctx = canvas.getContext("2d");
let generation = 1;

const road = new Road(canvas.width/2, canvas.width * 0.90);
const numTraffic = 100;
let initialPos = 50;

const n = 100;
const mutationRate = 0.1;

let damagedCars = 0;
let timeElapsed = 0;
const reloadTime = 10000;

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
        initialPos -= Math.floor(Math.random() * (250 - 100 + 1) + 100);
        if (random < 0.75) {
            let randomLane = Math.floor(Math.random() * 3.5);
            traffic.push(new Car(road.getLaneCenter(randomLane >= 2 ? 2 : randomLane), initialPos, 30, 50, "DUMMY", 2));
        } else {
            let randomLane = Math.floor(Math.random() * 3.5);
            traffic.push(new Car(road.getLaneCenter(randomLane), initialPos, 30, 50, "DUMMY", 2));
            traffic.push(new Car(road.getLaneCenter(randomLane >= 2 ? randomLane + 1 : 0), initialPos, 30, 50, "DUMMY", 2));
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

function checkDamaged() {
    damagedCars = 0;
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].damaged) {
            damagedCars += 1;
        }
    }
    let tempDamagedCars = damagedCars;
    if (timeElapsed >= reloadTime) {
        if (damagedCars == tempDamagedCars) {
            save();
            location.reload();
        }
        timeElapsed = 0;
    }
    if (damagedCars >= cars.length - 1 && timeElapsed > 0) {
        location.reload();
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
}

function discard() {
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("generation");
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
    timeElapsed += 1;
    checkDamaged();
    
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
        cars[i].calculateFitness(road);
    }       
    
    bestCar = cars.find(
       c => c.fitness == Math.max(...cars.map(c => c.fitness))
    );
            
    canvas.height = window.innerHeight;
        
    ctx.save()
    ctx.translate(0, -bestCar.y + canvas.height * 0.80);
        
    road.draw(ctx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(ctx, "red");
    }
        
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(ctx, "blue");
    }
    ctx.globalAlpha = 1;
    bestCar.draw(ctx, "blue", true, true);
        
    ctx.restore();

    generationText.innerHTML = generation;
    fitnessText.innerHTML = averageFitness();
    bestFitnessText.innerHTML = parseInt(bestCar.fitness);

    requestAnimationFrame(animate);
}

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      save();
    }
  });