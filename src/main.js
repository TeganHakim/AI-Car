const canvas = document.getElementById("myCanvas");
canvas.height = window.innerHeight;
canvas.width = 200;

const ctx = canvas.getContext("2d");

const road = new Road(canvas.width/2, canvas.width * 0.90);

const n = 200;
const mutationRate = 0.1;

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
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2),
    new Car(road.getLaneCenter(0), -800, 30, 50, "DUMMY", 2),
];

animate();

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