let photons = [];
let filters = [];

function setup() {
  createCanvas(1000, 800);
  angleMode(RADIANS);
  noStroke();

  photons.push(new Photon(createVector(width/2, height/2), createVector(1 / sqrt(2), 1 / sqrt(2))));
  filters.push(new Filter(createVector(3 * width / 4, height / 2), createVector(1, 0)));
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
}

class Photon {
  constructor(position, amplitudes) {
    this.position = position
    if (round(amplitudes.magSq(), 4) !== 1) {
      print("ERROR: NOT A VALID STATE")
    } else {
      this.amplitudes = amplitudes;
      this.rotation = asin(amplitudes.x) * (Math.sign(amplitudes.y));
    }
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
    } else {
      this.position.x += 1;
    }

    filters.forEach((f) => {
      // print(p5.Vector.dist(f.position, this.position));
      if (p5.Vector.dist(f.position, this.position) < 10) {
        [this.absorbed, this.amplitudes] = measure(this, f);
        this.rotation = asin(this.amplitudes.x) * (Math.sign(this.amplitudes.y));
      }
    })

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