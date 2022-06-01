class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 4, color = "blue", carType = "car") {
        this.fitness;
        this.x = x;
        this.y = y;
        if (carType == "car") {
            this.width = width;
            this.height = height;
        } else if (carType == "truck") {
            this.width = width + 15;
            this.height = height + 50;
        }
        this.controlType = controlType;
        this.radius = 100;

        this.speed = 0;
        this.turnSpeed = 0.02;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;
        
        this.useBrain = controlType == "AI";
        this.expoRate = 4;

        if (controlType != "DUMMY") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
        }
        this.controls = new Controls(controlType);

        this.img = new Image();
        this.img.src = carType == "car" ? "/img/car.png" : "/img/truck.png";

        this.mask = document.createElement("canvas");
        this.mask.width = this.width;
        this.mask.height = this.height;

        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () => {
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        }
    }

    update(roadBorders, traffic) {
        if (!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
            this.stayCenter = !this.#checkRadius(traffic);
        }
        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            
            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    calculateFitness(road, traffic) {
        this.fitness = Math.pow(mapValues(-1 * (this.y), [0, road.infinity], [0, 1]), this.expoRate);            
        if (this.damaged) {
            this.fitness = 0;
        }

        for (let i = 0; i < traffic.length; i++) {
            if (Math.abs(traffic[i].y - this.y) < this.radius && road.getLaneCenter(road.getClosestLane(this) == road.getLaneCenter(road.getClosestLane(traffic[i])))) {
                this.angle += Math.random() * (this.turnSpeed) * (Math.round(Math.random()) ? 1 : -1);
            }
        }
    }      

    #checkRadius(traffic) {
        for (let i = 0; i < traffic.length; i++) {
            if (Math.hypot(this.x - traffic[i].x, this.y - traffic[i].y) < this.radius) {
                return true;
            }
        }
        return false;
    }

    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }
        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        if (this.y > 0) {
            return true;
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height)/2;
        const alpha = Math.atan2(this.width, this.height);

        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad 
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });

        return points;
    }

    #move() {
        if (this.controls.forward) {    
            this.speed += this.acceleration;
        } 
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {            
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed/2) {            
            this.speed = -this.maxSpeed/2;
        }

        if (this.speed > 0) {            
            this.speed -= this.friction;
        }
        if (this.speed < 0) {            
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {            
            this.speed = 0;
        }

        if (this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;

            if (this.controls.left) {            
                this.angle += this.turnSpeed * flip;
            }
            if (this.controls.right) {            
                this.angle -= this.turnSpeed * flip;
            }
        }       

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;

        const giveDist = 10 + Math.abs(this.speed);
        if (this.stayCenter) {
            if ((road.getLaneCenter(road.getClosestLane(this)) - this.x) > giveDist) {
                this.angle -= this.turnSpeed;
            } else if ((road.getLaneCenter(road.getClosestLane(this)) - this.x) < -giveDist) {
                this.angle += this.turnSpeed;
            }
        }
    }

    draw(ctx, drawSensor = false, drawRadius = false) {
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
       
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        if (!this.damaged) {
            ctx.drawImage(this.mask, -this.width / 2, - this.height / 2, this.width, this.height);
            ctx.globalCompositeOperation = "multiply";
        }
        ctx.drawImage(this.img, -this.width / 2, - this.height / 2, this.width, this.height);
        ctx.restore();
        
        if (drawRadius) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
}
