//center of the canvas
let centerX, centerY;

// starts in -1 because that value does not exist on the second, minute and hour functions
let prevSecond = -1;
let prevMinute = -1;
let prevHour = -1;

//variables for the circles
let circleDiameter;
let radius;

//variables for random rgb color
let r, g, b;
//same alpha value for all circles
let alphaValue;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
  centerX = width / 2;
  centerY = height / 2;
  noStroke();
}

function draw() {
  drawHours();
  drawMinutes();
  drawSeconds();
}

function drawSeconds() {
  //check if seconds has changed
  if (second() !== prevSecond) {
    //new random color
    randomColor();
    alphaValue = 50;
    circleDiameter = height / 10;
    radius = circleDiameter;
    // Calculate angle based on current second
    let angle = map(second(), 0, 60, -PI / 2, TWO_PI - PI / 2);
    // Calculate position based on circular motion
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;
    // Draw the moving circle
    fill(r, g, b, alphaValue);
    circle(x, y, circleDiameter);
    //saves value so the circle is not drawn each frame
    prevSecond = second();
  }
}

function drawMinutes() {
  //check if minute has changed
  if (minute() !== prevMinute) {
    //new random color
    randomColor();
    alphaValue = 65;
    circleDiameter = height / 5;
    radius = circleDiameter * 0.75;

    // Calculate minute position
    let angle = map(minute(), 0, 60, -PI / 2, TWO_PI - PI / 2);

    // Calculate position based on circular motion
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;

    // Draw the moving circle
    fill(r, g, b, alphaValue);
    circle(x, y, circleDiameter);
    //saves value so the circle is not drawn each frame
    prevMinute = minute();
  }
}

function drawHours() {
  //check if hour has changed
  if (hour() !== prevHour) {
    //new random color
    randomColor();
    alphaValue = 70;
    circleDiameter = height / 2.5;
    radius = circleDiameter * 0.62;

    //calculate hour position
    let angle = map(hour() % 12, 0, 12, -PI / 2, TWO_PI - PI / 2);

    // Calculate position based on circular motion
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;

    // Draw the moving circle
    fill(r, g, b, alphaValue);
    circle(x, y, circleDiameter);
    //saves value so the circle is not drawn each frame
    prevHour = hour();
  }
}

function randomColor() {
  r = random(0, 255);
  g = random(0, 255);
  b = random(0, 255);
}
