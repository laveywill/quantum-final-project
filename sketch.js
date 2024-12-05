let photons = [];
let filters = [];
let mirrors = [];
let waveplates = [];
let beamsplitters = [];

let standard_basis = [];

let speed_slider;
let select;
let s;

const WAVEPLATE_COOLDOWN = 200;

function setup() {
  createCanvas(windowWidth, windowHeight-200);
  angleMode(RADIANS);
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();

  speed_slider = createSlider(0, 15, 4, 1);
  speed_slider.position(200, height+50);
  speed_slider.input(updatePhotonSpeeds);

  standard_basis.push(createVector(1, 0));
  standard_basis.push(createVector(0, 1));


  select = createSelect();
  select.position(50, height+50);
  select.option("Vertical");
  select.option("Horizontal");
  select.option("45 Degree");
  select.option("Cyclical");
  select.option("Interferometer");
  select.selected("Interferometer");
  select.changed(updateCanvas);

  updateCanvas();
}

function draw() {
  background(0, 0, 95);

  photons.forEach((p) => {
    p.superpositions = p.superpositions.filter((s) => !s.absorbed)
  });

  photons = photons.filter((p) => p.superpositions.length > 0);

  if (photons.length === 0) {
    if (s === "Cyclical") {
      photons.push(new Photon(createVector(width/4, height/4), createVector(1,0), createVector(1, 0), 1));
    } else if (s === "Vertical") {
      photons.push(new Photon(createVector(width/4, height/2), createVector(1, 0), createVector(1, 0), 1));
    } else if (s === "Horizontal")  {
      photons.push(new Photon(createVector(width/4, height/2), createVector(0, 1), createVector(1, 0), 1));
    } else if (s === "45 Degree") {
      photons.push(new Photon(createVector(width/4, height/2), createVector(1 / sqrt(2), 1 / sqrt(2)), createVector(1, 0), 1));
    } 
  }

  photons.forEach((p) => {
    p.update();
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

function updateCanvas() {
  photons = [];
  filters = [];
  mirrors = [];
  waveplates = [];
  beamsplitters = [];

  s = select.value();
  switch (s) {
    case "Vertical":
      initializeVertical();
      break;
    case "Horizontal":
      initializeHorizontal();
      break;
    case "45 Degree":
      initialize45();
      break;
    case "Cyclical":
      initializeCyclical();
      break;
    case "Interferometer":
      initializeInterferometer();
      break;
  }
}

function initializeVertical() {
  photons.push(new Photon(createVector(width/4, height/2), createVector(1, 0), createVector(1, 0), 1));
  filters.push(new Filter(createVector(width/2, height/2), createVector(1,0)));
}

function initializeHorizontal() {
  photons.push(new Photon(createVector(width/4, height/2), createVector(0, 1), createVector(1, 0), 1));
  filters.push(new Filter(createVector(width/2, height/2), createVector(1,0)));
}

function initialize45() {
  photons.push(new Photon(createVector(width/4, height/2), createVector(1/sqrt(2), 1/sqrt(2)), createVector(1, 0), 1));
  filters.push(new Filter(createVector(width/2, height/2), createVector(1,0)));
}

function initializeInterferometer() {

  photons.push(new Photon(createVector(width/4-100, height/4), createVector(1, 0), createVector(1, 0), 1));
  waveplates.push(new Waveplate(createVector(width/3 - 100, height/4), PI/6));

  mirrors.push(new Mirror(createVector(3*width/4, height / 4), PI/4)); 
  mirrors.push(new Mirror(createVector(width/3-5, 3*height / 4), PI/4)); 

  beamsplitters.push(new Beamsplitter(createVector(width/3, height/4)));
  beamsplitters.push(new Beamsplitter(createVector(3*width/4, 3*height/4)));

}

function initializeCyclical() {

  photons.push(new Photon(createVector(width/4, height/4), createVector(1,0), createVector(1, 0), 1));
  waveplates.push(new Waveplate(createVector(width/3, height/4), PI/4));

  mirrors.push(new Mirror(createVector(3*width/4, height / 4), PI/4));
  mirrors.push(new Mirror(createVector(3*width/4, 3*height / 4), -PI/4));

  filters.push(new Filter(createVector(width/3, 3*height/4), createVector(1,0)))

  mirrors.push(new Mirror(createVector(width/5, 3*height / 4), PI/4));
  mirrors.push(new Mirror(createVector(width/5, height / 4), -PI/4));
}

class Photon {
  constructor(position, amplitudes, direction, alpha) {
    this.superpositions = [];
    this.superpositions.push(new Superposition(position, amplitudes, direction, alpha));
    this.closeToBeamsplitter = false;
  }

  update() {
    this.superpositions.forEach((s) => {
      s.update();
      s.draw();
    });

    this.closeToBeamsplitter = this.superpositions.some((s) => 
      beamsplitters.some((b) => p5.Vector.dist(b.position, s.position) < speed_slider.value()/2)
    );


    if (this.closeToBeamsplitter) {

      const original_superpositions = [...this.superpositions];

      if (original_superpositions.length === 1) {
        console.log("first")

        original_superpositions.forEach((s) => {
          
          const percent_vertical = sin(s.rotation)**2;

          if (1-percent_vertical > 0) {
            this.superpositions.push(
              new Superposition(s.position.copy(), createVector(1, 0), s.direction.copy().normalize(), 1-percent_vertical)
            );
            console.log(1-percent_vertical)
          }
          if (percent_vertical > 0) {
            this.superpositions.push(
              new Superposition(s.position.copy(), createVector(0, 1), s.direction.copy().rotate(PI/2).normalize(), percent_vertical)
            );  
            console.log(percent_vertical)
          }

          this.superpositions = this.superpositions.filter((item) => item !== s);
        })
      } else if (original_superpositions.length > 1) {
        this.superpositions.forEach((s) => {
          const weightedRotation = this.superpositions.reduce(
            (acc, s) => acc + s.alpha * s.rotation,
            0
          );

          this.superpositions = [
            new Superposition(random(this.superpositions).position.copy(), createVector(sin(weightedRotation), cos(weightedRotation)), createVector(0, 1), 1)
          ];
        })
      }

      this.closeToBeamsplitter = false;
    } 
  }
}

class Superposition {
  constructor(position, amplitudes, direction, alpha) {
    this.position = position
    this.amplitudes = amplitudes;
    this.direction = direction.setMag(speed_slider.value());
    this.rotation = atan2(this.amplitudes.y, this.amplitudes.x);
    this.absorbed = false;
    this.alpha = alpha;
    this.lastWaveplateInteraction = 0;
  }

  draw() {
    fill(50, 100, 100, this.alpha);
    circle(this.position.x, this.position.y, 20);
    
    push();
    translate(this.position.x, this.position.y);
    rotate(this.rotation);
    fill(0, 0, 0, this.alpha);
    triangle(-5, 5, 5, 5, 0, -5);
    pop();
  }

  update() {
    if (this.position.x > width) {
      this.absorbed = true;
    } else if (this.position.x < 0) {
      this.absorbed = true;
    } else if (this.position.y > height) {
      this.absorbed = true;
    } else if (this.position.y < 0) {
      this.absorbed = true;
    } 
      
    this.position.add(this.direction);
    

    filters.forEach((f) => {
      if (p5.Vector.dist(f.position, this.position) < speed_slider.value()) {
        [this.absorbed, this.amplitudes] = measure(this, f);
        this.rotation = atan2(this.amplitudes.y, this.amplitudes.x);
      }
    });

    mirrors.forEach((m) => {
      // Define start and end of the mirror line
      let start = p5.Vector.fromAngle(m.angle).mult(-30).add(m.position);
      let end = p5.Vector.fromAngle(m.angle).mult(30).add(m.position);
    
      // Check if photon intersects the mirror
      if (lineSegmentIntersects(this.position, this.direction, start, end)) {
        // Calculate normal vector
        let normal = p5.Vector.sub(end, start).rotate(HALF_PI).normalize();
    
        // Reflect photon direction
        let dotProduct = this.direction.dot(normal);
        let reflection = this.direction.sub(p5.Vector.mult(normal, 2 * dotProduct));
        this.direction = reflection.normalize().setMag(speed_slider.value());
      }
    });

    waveplates.forEach((w) => {
      if (
        p5.Vector.dist(w.position, this.position) < speed_slider.value() &&
        millis() - this.lastWaveplateInteraction > WAVEPLATE_COOLDOWN
      ) {
        // Apply waveplate effect
        this.rotation += w.angle;
        this.amplitudes = p5.Vector.fromAngle(this.rotation);
    
        // Update the last interaction time
        this.lastWaveplateInteraction = millis();
      }
    });

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
    rotate(this.angle);
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

function updatePhotonSpeeds() {
  let newSpeed = speed_slider.value();
  photons.forEach((p) => {
    p.superpositions.forEach((s) => {
      s.direction.setMag(newSpeed); // Adjust magnitude of the direction vector
    });
  });
}

function lineSegmentIntersects(position, direction, start, end) {
  let ab = p5.Vector.sub(end, start); // Vector from start to end of mirror
  let ap = p5.Vector.sub(position, start); // Vector from start to photon position
  
  // Project photon onto mirror line
  let projectionLength = ap.dot(ab) / ab.magSq();
  
  // Check if projection lies within segment bounds
  if (projectionLength < 0 || projectionLength > 1) {
    return false; // Outside the segment
  }
  
  // Compute the closest point on the line segment
  let projection = ab.copy().mult(projectionLength);
  let closestPoint = start.copy().add(projection);
  
  // Check distance from photon to closest point
  let distanceToLine = p5.Vector.dist(closestPoint, position);
  return distanceToLine < 5; // 5 is the collision threshold
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
      p.superpositions.forEach((s) => {
        s.amplitudes = p5.Vector.fromAngle(random(0, TWO_PI));
        s.rotation = atan2(s.amplitudes.y, s.amplitudes.x);
      })
    })
  }
}