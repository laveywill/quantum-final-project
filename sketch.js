let photons = [];
let filters = [];
let mirrors = [];
let waveplates = [];

function setup() {
  createCanvas(1000, 800);
  angleMode(RADIANS);
  noStroke();

  photons.push(new Photon(createVector(width/2, height/2), createVector(0, 1), createVector(1, 0)));
  filters.push(new Filter(createVector(3 * width / 4, height / 2), createVector(1, 0)));
  mirrors.push(new Mirror(createVector(2*width / 3, height / 2), PI/4));
  waveplates.push(new Waveplate(createVector(3*width/5, height/2), PI/4));
}

function draw() {
  background(240);

  photons = photons.filter((p) => !p.absorbed);

  photons.forEach((p) => {
    p.update();
    p.draw();
  });

  filters.forEach((f) => {
    f.draw();
  });

  mirrors.forEach((m) => {
    m.draw();
  });

  waveplates.forEach((w) => {
    w.draw();
  });
}

class Photon {
  constructor(position, amplitudes, direction) {
    this.position = position
    this.amplitudes = amplitudes;
    this.direction = direction;
    this.rotation = atan2(this.amplitudes.y, this.amplitudes.x);;
    this.absorbed = false;
  }

  draw() {
    fill('yellow')
    circle(this.position.x, this.position.y, 20);
    
    push();
    translate(this.position.x, this.position.y);
    rotate(this.rotation);
    fill('black');
    triangle(-5, 5, 5, 5, 0, -5);
    pop();
  }

  update() {
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    } else if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    } else {
      this.position.add(this.direction);
    }

    filters.forEach((f) => {
      if (p5.Vector.dist(f.position, this.position) < 10) {
        [this.absorbed, this.amplitudes] = measure(this, f);
        this.rotation = asin(this.amplitudes.x) * (Math.sign(this.amplitudes.y));
      }
    });

    mirrors.forEach((m) => {
      const distance = p5.Vector.dist(m.position, this.position);
    
      if (distance < 3) {
        // currently traveling at pi/2 into a pi/4 mirror. We want the result to be traveling at 0.
        const normal = p5.Vector.fromAngle(m.angle).normalize();

        // Reflect the direction using the formula:
        // r = d - 2 (d · n) n
        const dotProduct = this.direction.dot(normal);
        const reflection = this.direction.sub(p5.Vector.mult(normal, 2 * dotProduct));
    
        // Update direction
        this.direction = reflection.normalize();
      }
    });

    waveplates.forEach((w) => {
      if (p5.Vector.dist(w.position, this.position) < 1) {
        this.rotation += w.angle;
        this.amplitudes = p5.Vector.fromAngle(this.rotation);
      }
    });

  }
}

class Mirror {
  constructor(position, angle) {
    this.position = position;
    this.angle = angle;
  }

  draw() {
    stroke('grey');
    strokeWeight(4);

    push();
    translate(this.position.x, this.position.y);
    rotate(-this.angle);
    line(-20, 0, 20, 0);
    stroke('red');
    point(0, 0)
    pop();

    noStroke();
  }
}

class Waveplate {
  constructor(position, angle) {
    this.position = position;
    this.angle = angle;
    this.text = nf(degrees(this.angle), 1, 1);
  }

  draw() {
    fill('lightblue');

    push();
    translate(this.position.x, this.position.y);
    circle(0, 0, 40);
    textSize(20);
    fill('black');
    text(concat(this.text, "º"), -15, 7);
    pop();

  }
}

class Filter {
  constructor(position, polarization) {
    this.position = position;
    this.polarization = polarization; // measurement basis as a normalized vector
  }

  draw() {
    fill('blue');
    rect(this.position.x - 10, this.position.y - 20, 20, 40);
  }
}

function measure(photon, filter) {

  if (!(filter.polarization instanceof p5.Vector)) {
    print("Error: filter.polarization is not a p5.Vector");
    print(filter.polarization);
  }

  // Calculate the probability of passing through the filter
  let projection = p5.Vector.dot(photon.amplitudes, filter.polarization);
  let probability = projection ** 2;

  // Determine if photon passes or is absorbed
  if (random() < probability) {
    return [false, filter.polarization.copy()];
  } else {
    return [true, createVector(1, 0)];
  }
}

function keyPressed() {
  if (key === "p") {
    if (isLooping()) {
      noLoop();
    } else {
      loop();
    }
  } else if (key === "r") {
    photons.forEach((p) => {
      p.amplitudes = p5.Vector.fromAngle(random(0, TWO_PI));
      p.rotation = atan2(p.amplitudes.y, p.amplitudes.x);
    })
  }
}