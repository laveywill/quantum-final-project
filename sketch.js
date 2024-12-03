let photons = [];
let filters = [];
let mirrors = [];
let waveplates = [];
let beamsplitters = [];

let standard_basis = [];

const SPEED = 5;

function setup() {
  createCanvas(windowWidth-200, windowHeight-200);
  angleMode(RADIANS);
  noStroke();

  standard_basis.push(createVector(1, 0));
  standard_basis.push(createVector(0, 1));

  // initializeDraft();
  initializeInterferometer();
  
}

function draw() {
  background(240);

  photons = photons.filter((p) => !p.absorbed);

  // if (photons.length <= 0) {
  //   photons.push(new Photon(createVector(width/4, height/4), createVector(1, 0), createVector(1, 0)));
  // }

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

  beamsplitters.forEach((b) => {
    b.draw();
  });
}

function initializeInterferometer() {

  photons.push(new Photon(createVector(width/4-100, height/4), createVector(1,0), createVector(1, 0)));
  waveplates.push(new Waveplate(createVector(width/3 - 100, height/4), PI/4));

  mirrors.push(new Mirror(createVector(3*width/4, height / 4), -PI/4)); 
  mirrors.push(new Mirror(createVector(width/3, 3*height / 4), -PI/4)); 

  beamsplitters.push(new Beamsplitter(createVector(width/3, height/4)));
  beamsplitters.push(new Beamsplitter(createVector(3*width/4, 3*height/4)));

  mirrors.push();
}

function initializeDraft() {

  photons.push(new Photon(createVector(width/4, height/4), createVector(1,0), createVector(1, 0)));
  waveplates.push(new Waveplate(createVector(width/3, height/4), PI/4));

  mirrors.push(new Mirror(createVector(3*width/4, height / 4), -PI/4));
  mirrors.push(new Mirror(createVector(3*width/4, 3*height / 4), PI/4));

  filters.push(new Filter(createVector(width/3, 3*height/4), createVector(1,0)))

  mirrors.push(new Mirror(createVector(width/5, 3*height / 4), -PI/4));
  mirrors.push(new Mirror(createVector(width/5, height / 4), PI/4));
}

// class Photon {
//   constructor() {
//     this.superpositions = [];
//   }
// }

class Photon {
  constructor(position, amplitudes, direction) {
    this.position = position
    this.amplitudes = amplitudes;
    this.direction = direction.mult(SPEED);
    this.rotation = atan2(this.amplitudes.y, this.amplitudes.x);
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
      if (p5.Vector.dist(f.position, this.position) < SPEED) {
        [this.absorbed, this.amplitudes] = measure(this, f);
        this.rotation = atan2(this.amplitudes.y, this.amplitudes.x);
      }
    });

    mirrors.forEach((m) => {
      const distance = p5.Vector.dist(m.position, this.position);
    
      if (distance < SPEED) {
        const normal = p5.Vector.fromAngle(m.angle).normalize();

        const dotProduct = this.direction.dot(normal);
        const reflection = this.direction.sub(p5.Vector.mult(normal, 2 * dotProduct));
    
        this.direction = reflection.normalize().mult(SPEED);
      }
    });

    waveplates.forEach((w) => {
      if (p5.Vector.dist(w.position, this.position) < SPEED/2) {
        this.rotation += w.angle;
        this.amplitudes = p5.Vector.fromAngle(this.rotation);
      }
    });

    beamsplitters.forEach((b) => {
      if (p5.Vector.dist(b.position, this.position) < SPEED) {
        // photons that are vertically polarized dont change direction
        // photons that are horizontally polarized change direction
        
      }
    })

  }
}

class Beamsplitter {
  constructor(position) {
    this.position = position;
  }

  draw() {
    stroke('black')
    noFill();
    push();
    translate(this.position.x, this.position.y);
    rect(-40, -40, 80, 80);
    // line from top left to bottom right
    line(-40, -40, 40, 40);
    pop();

    noStroke();
  }
}

class Mirror {
  constructor(position, angle) {
    this.position = position;
    this.angle = angle;
  }

  draw() {

    push();
    stroke('grey');
    strokeWeight(4);
    translate(this.position.x, this.position.y);
    rotate(-this.angle);
    line(-30, 0, 30, 0);
    pop();
  }
}

class Waveplate {
  constructor(position, angle) {
    this.position = position;
    this.angle = angle;
    this.text = nf(degrees(this.angle), 1, 1);
  }

  draw() {

    push();
    fill('lightblue');
    translate(this.position.x, this.position.y);
    circle(0, 0, 60);
    textSize(20);
    fill('black');
    text(concat(this.text, "º"), -20, 7);
    pop();

  }
}

class Filter {
  constructor(position, polarization) {
    this.position = position;
    this.polarization = polarization; // measurement basis as a normalized vector
  }

  draw() {
 
    push();
    translate(this.position.x, this.position.y);
    fill('darkgrey');
    stroke('lightyellow')
    rect(-20, -40, 40, 80);

    stroke('yellow');
    strokeWeight(3);

    if (this.polarization.x === 1 & this.polarization.y === 0) {
      line(-5, -40, -5, 40);
      line(5, -40, 5, 40);
      line(-15, -40, -15, 40);
      line(15, -40, 15, 40);
    } else if (this.polarization.x === 0 & this.polarization.y === 1) {
      line(-10, -10, 10, -10);
      line(-10, 10, 10, 10);
    }

    noStroke();
    pop();

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
  print(probability);

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