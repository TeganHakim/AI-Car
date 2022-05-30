const canvas = document.getElementById("myCanvas");
canvas.height = window.innerHeight;
canvas.width = 200;

const ctx = canvas.getContext("2d");

const road = new Road(canvas.width/2, canvas.width * 0.90);
const numTraffic = 100;
let initialPos = -100;

const n = 200;
const mutationRate = 0.1;

let damagedCars = 0;
let timeElapsed = 0;
const reloadTime = 2000;

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

const traffic = [
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2)
];

addTraffic();
animate();

function addTraffic() {
    for (let i = 0; i < numTraffic; i++) {
        const random = Math.random();
        initialPos -= Math.floor(Math.random() * (250 - 100 + 1) + 100);
        if (random < 0.75) {
            let randomLane = Math.floor(Math.random() * 3);
            traffic.push(new Car(road.getLaneCenter(randomLane >= 2 ? 2 : randomLane), initialPos, 30, 50, "DUMMY", 2));
        } else {
            let randomLane = Math.floor(Math.random() * 3);
            traffic.push(new Car(road.getLaneCenter(randomLane), initialPos, 30, 50, "DUMMY", 2));
            traffic.push(new Car(road.getLaneCenter(randomLane >= 2 ? randomLane + 1 : 0), initialPos, 30, 50, "DUMMY", 2));
        }
    }
}

function checkDamaged() {
    for (let i = 0; i < cars.length; i++) {
        if (cars.damaged) {
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
    if (damagedCars == cars.length && timeElapsed > 0) {
        location.reload();
    }

}

function save() {
    localStorage.setItem(
        "bestBrain", 
        JSON.stringify(bestCar.brain)
    );
}

function discard() {
    localStorage.removeItem("bestBrain");
}

function generateCars(n) {
    const cars = [];
    for (let i = 0; i < n; i++) {
        cars.push(new Car(
            road.getLaneCenter(1),
            100,
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
    }
    
    bestCar = cars.find(
        c => c.y == Math.min(...cars.map(c => c.y))
        );
        // Math.abs(road.getLaneCenter(road.getClosestLane(c)) - c.x) == Math.min(...cars.map(c => Math.abs(road.getLaneCenter(road.getClosestLane(c)) - c.x))
        
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
        bestCar.draw(ctx, "blue", true);
        
        ctx.restore();
        requestAnimationFrame(animate);
    }