const SHAPE = {
	SQUARE: "square",
	CIRCLE: "circle"
}

const COLOUR = {
	RED: "red",
	GREEN: "green",
	BLUE: "blue",
	YELLOW: "yellow",
	PURPLE: "purple",
	ORANGE: "orange"
}

const COLOURS = Object.values(COLOUR)

class Shape {
	constructor(x, y, size, colour) {
		this.x = x
		this.y = y
		this.size = size
		this.colour = colour
		this.kind = ""
	}

	distanceTo(other) {
		return getDistance(this.x, this.y, other.x, other.y)
	}

	get perspectiveX() {
		if (ctx.drawingPerspective) {
			return this.x - ctx.drawingPerspective.x + canvas.width / 2
		}

		return this.x
	}

	get perspectiveY() {
		if (ctx.drawingPerspective) {
			return this.y - ctx.drawingPerspective.y + canvas.height / 2
		}

		return this.y
	}
}

class Circle extends Shape {
	constructor(x, y, size, colour) {
		super(x, y, size, colour)

		this.kind = SHAPE.CIRCLE
	}

	draw() {
		var x = this.perspectiveX
		var y = this.perspectiveY

		ctx.fillStyle = this.colour
		ctx.beginPath()
		ctx.arc(x, y, this.size, 0, 2 * Math.PI)
		ctx.fill()
	}

	overlaps(other) {
		if (other.kind == SHAPE.CIRCLE) {
			return this.overlapsCircle(other)
		}

		if (other.kind == SHAPE.SQUARE) {
			return this.overlapsSquare(other)
		}
	}

	overlapsCircle(other) {
		var distance = this.distanceTo(other)
		return this.size + other.size > distance
	}

	overlapsSquare(other) {
		return other.overlapsCircle(this)
	}
}

class Square extends Shape {
	constructor(x, y, size) {
		super(x, y, size)

		this.kind = SHAPE.SQUARE
	}

	draw() {
		var x = this.perspectiveX
		var y = this.perspectiveY

		ctx.fillStyle = this.colour
		ctx.fillRect(x - this.size, y - this.size, this.size * 2, this.size * 2)
	}

	get leftEdge() {
		return this.x - this.size
	}

	get rightEdge() {
		return this.x + this.size
	}

	get topEdge() {
		return this.y - this.size
	}

	get bottomEdge() {
		return this.y + this.size
	}

	overlaps(other) {
		if (other.kind == SHAPE.SQUARE) {
			return this.overlapsSquare(other)
		}

		if (other.kind == SHAPE.CIRCLE) {
			return this.overlapsCircle(other)
		}
	}

	overlapsSquare(other) {
		return (this.leftEdge < other.rightEdge &&
			    this.topEdge < other.bottomEdge &&
			    other.leftEdge < this.rightEdge &&
			    other.topEdge < this.bottomEdge)
	}

	overlapsCircle(circle) {
		// https://www.jeffreythompson.org/collision-detection/table_of_contents.php
		var testX = circle.x
		var testY = circle.y

		if (circle.x < this.leftEdge) testX = this.leftEdge
		else if (circle.x > this.rightEdge) testX = this.rightEdge

		if (circle.y < this.topEdge) testY = this.topEdge
		else if (circle.y > this.bottomEdge) testY = this.bottomEdge 

		var distX = circle.x - testX
		var distY = circle.y - testY
		var distance = Math.sqrt((distX*distX) + (distY*distY))

		var circleRadius = circle.size / 2

		if (distance <= circleRadius) {
			return true
		}

		return false
	}
}

const Environment = {
	standard: {
		friction: -0.08,
		force: 0.5,
		mass: 1,
		elasticity: 0.9
	},

	gravity: 0
}

class Entity {
	constructor() {
		this.x = 0
		this.y = 0
		this.velX = 0
		this.velY = 0
		this.accelX = 0
		this.accelY = 0

		this.shape = new Circle()
		this.size = 10
		this.colour = "red"

		this.active = true
		this.locked = false
		this.collision = true
		this.friction = Environment.standard.friction
		this.force = Environment.standard.force
		this.mass = Environment.standard.mass
	}

	update() {
		if (!this.active) {
			return
		}

		if (this.locked) {
			return
		}

		this.accelX += this.velX * this.friction
		this.accelY += this.velY * this.friction

		this.velX += this.accelX
		this.velY += this.accelY

		this.x += this.velX + 0.5 * this.accelX
		this.y += this.velY + 0.5 * this.accelY

		this.accelX = 0
		this.accelY = Environment.gravity
	}

	get acceleration() {
		return this.force / this.mass // F = m * a
	}

	distanceTo(other) {
		return getDistance(this.x, this.y, other.x, other.y)
	}

	moveInDirection(direction) {
		if (direction.left) this.accelX = -this.acceleration
		if (direction.right) this.accelX = +this.acceleration
		if (direction.up) this.accelY = -this.acceleration // Inverted due to canvas direction
		if (direction.down) this.accelY = +this.acceleration

		if (this.accelX != 0 && this.accelY != 0) {
			this.accelX *= 0.707
			this.accelY *= 0.707
		}
	}

	moveTowards(otherEntity) {
		this.moveTowardsPoint(otherEntity.x, otherEntity.y)
	}

	moveTowardsPoint(x, y) {
		var dx = x - this.x
		var dy = y - this.y
		var radians = Math.atan2(dy, dx)
		this.moveAtAngle(radians)
	}

	moveAtAngle(radians) {
		this.accelY = this.acceleration * Math.sin(radians)
		this.accelX = this.acceleration * Math.cos(radians)
	}

	moveAtAngleWithPercent(radians, percent) {
		this.accelY = this.acceleration * Math.sin(radians) * percent
		this.accelX = this.acceleration * Math.cos(radians) * percent
	}

	checkInteraction(other) {
		if (!this.active && !other.active) {
			return
		}

		if (!this.overlaps(other)) {
			return
		}

		if (!this.active) {
			this.active = true
		}

		if (!other.active) {
			other.active = true
		}

		this.handleCollision(other)
	}

	handleCollision(other) {
		if (!this.collision || !other.collision) {
			return
		}

		if (this.shape.kind == other.shape.kind) {
			if (this.shape.kind == SHAPE.CIRCLE) {
				return handleCircleCollision(this, other)
			}
			else {
				return handleSquareCollision(this, other)
			}
		}

		if (this.shape.kind == SHAPE.SQUARE) {
			return handleSquareCircleCollision(this, other)
		}
		else {
			return handleSquareCircleCollision(other, this)
		}
	}

	overlaps(other) {
		return this.shape.overlaps(other.shape)
	}

	draw() {
		this.shape.x = this.x
		this.shape.y = this.y
		this.shape.size = this.size
		this.shape.colour = this.colour

		this.shape.draw()
	}
}

function handleCircleCollision(a, b) {
	var dx = b.x - a.x
	var dy = b.y - a.y
	var distance = Math.sqrt(dx*dx + dy*dy)
	var normX = dx / distance
	var normY = dy / distance
	var relVelX = a.velX - b.velX
	var relVelY = a.velY - b.velY
	var speed = relVelX * normX + relVelY * normY

	if (speed < 0) {
		return
	}

	if (speed == 0) {
		speed = 1
	}

	var impulse = 2 * speed / (a.mass + b.mass)
	a.velX -= (impulse * b.mass * normX)
	a.velY -= (impulse * b.mass * normY)
	b.velX += (impulse * a.mass * normX)
	b.velY += (impulse * a.mass * normY)
}

function handleSquareCollision(a, b) {
	var dx = b.x - a.x
	var dy = b.y - a.y

	var absDx = Math.abs(dx)
	var absDy = Math.abs(dy)

	if (absDx > absDy) {
		dy = 0
	}

	if (absDy > absDx) {
		dx = 0
	}

	var distance = Math.sqrt(dx*dx + dy*dy)
	var normX = dx / distance
	var normY = dy / distance
	var relVelX = a.velX - b.velX
	var relVelY = a.velY - b.velY
	var speed = relVelX * normX + relVelY * normY

	if (speed < 0) {
		return
	}

	if (speed == 0) {
		speed = 1
	}

	var impulse = 2 * speed / (a.mass + b.mass)
	a.velX -= (impulse * b.mass * normX)
	a.velY -= (impulse * b.mass * normY)
	b.velX += (impulse * a.mass * normX)
	b.velY += (impulse * a.mass * normY)
}

function handleSquareCircleCollision(square, circle) {
	if (square.size >= circle.size) {
		return handleSquareCollision(square, circle)
	}
	else {
		return handleCircleCollision(circle, square)
	}
}

class Game {
	constructor() {
		this.updateDelay = 10
		this.controller = new Controller()

		this.player = null

		this.entities = []

		this.drawFunc = this.defaultDrawFunc
		this.updateFunc = this.defaultUpdateFunc
	}

	addEntity(entity) {
		this.entities.push(entity)
	}

	removeEntity(entity) {
		 this.entities.remove(entity)
	}

	restart() {

	}

	start() {
		this.animation = requestAnimationFrame(this.drawStep.bind(this))
		this.updateInterval = setInterval(this.updateStep.bind(this), this.updateDelay)
	}

	stop() {
		cancelAnimationFrame(this.animation)
		clearInterval(this.updateInterval)
	}

	drawStep() {
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		this.drawFunc()

		this.animation = requestAnimationFrame(this.drawStep.bind(this))
	}

	defaultDrawFunc() {
		for (var entity of this.entities) {
			entity.draw()
		}

		if (this.controller.joystick.enabled) {
			this.controller.joystick.draw()
		}

		// Draw player last
		if (this.player) {
			this.player.draw()
		}
	}

	updateStep() {
		this.updateFunc()
	}

	defaultUpdateFunc() {
		for (var i = 0; i < this.entities.length; i++) {
			var entityA = this.entities[i]

			for (var j = i + 1; j < this.entities.length; j++) {
				var entityB = this.entities[j]

				entityA.checkInteraction(entityB)
			}

			entityA.update()
		}
	}
}