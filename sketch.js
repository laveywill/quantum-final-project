let photons = [];
let filters = [];
let mirrors = [];

function setup() {
  createCanvas(1000, 800);
  angleMode(RADIANS);
  noStroke();

  photons.push(new Photon(createVector(width/2, height/2), createVector(1 / sqrt(2), 1 / sqrt(2)), createVector(1, 0)));
  filters.push(new Filter(createVector(3 * width / 4, height / 2), createVector(1, 0)));
  mirrors.push(new Mirror(createVector(2*width / 3, height / 2), PI/4));
}

function draw() {
  background(240);

  photons = photons.filter((p) => !p.absorbed)

  photons.forEach((p) => {
    p.update();
    p.draw();
  })

  filters.forEach((f) => {
    f.draw();
  })

  mirrors.forEach((m) => {
    m.draw();
  })
}

class Photon {
  constructor(position, amplitudes, direction) {
    this.position = position
    if (round(amplitudes.magSq(), 4) !== 1) {
      print("ERROR: NOT A VALID STATE")
    } else {
      this.amplitudes = amplitudes;
      this.rotation = asin(amplitudes.x) * (Math.sign(amplitudes.y));
    }
    this.absorbed = false;
    this.direction = direction;
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
      this.position = this.position + this.direction;;
    }

    filters.forEach((f) => {
      if (p5.Vector.dist(f.position, this.position) < 10) {
        [this.absorbed, this.amplitudes] = measure(this, f);
        this.rotation = asin(this.amplitudes.x) * (Math.sign(this.amplitudes.y));
      }
    })

    mirrors.forEach((m) => {
      const distance = p5.Vector.dist(m.position, this.position);
    
      if (distance < 10) {
        // Mirror's normal vector based on its angle
        const normal = p5.Vector.fromAngle(m.angle).normalize();
    
        // Compute the reflection using the formula:
        // r = d - 2 * (d . n) * n
        const dotProduct = this.direction.dot(normal);
        const reflection = this.direction.sub(p5.Vector.mult(normal, 2 * dotProduct));
    
        // Update the photon's direction directly
        this.direction = reflection.normalize();
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
    rotate(this.angle);
    line(0, 0, 10, 0);
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
      p.amplitudes = p5.Vector.fromAngle(random(0, 2*PI), 1);
    })
  }
}