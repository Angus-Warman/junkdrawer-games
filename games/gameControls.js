class InputEvent extends Event {
	constructor(type, posX, posY) {
		super(type)
		/**
		 * @property {number}
		 */
		this.posX = posX
		this.posY = posY
	}
}

class Controller {
	constructor() {
		this.keysPressed = {}
		document.addEventListener("keydown", this.handleKeyDown.bind(this))
		document.addEventListener("keyup", this.handleKeyUp.bind(this))

		canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
		canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
		canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))

		canvas.addEventListener("touchstart", this.handleTouchStart.bind(this))
		canvas.addEventListener("touchmove", this.handleTouchMove.bind(this))
		canvas.addEventListener("touchend", this.handleTouchEnd.bind(this))

		this.joystick = new Joystick()
	}

	handleKeyDown(event) {
		this.keysPressed[event.key] = true
		// event.preventDefault()

		this.joystick.handleDirections(this.getKeyDirections())
	}

	handleKeyUp(event) {
		this.keysPressed[event.key] = false
		// event.preventDefault()

		this.joystick.handleDirections(this.getKeyDirections())
	}
	
	getKeyDirections() {
		var directions = {left: false, right: false, up: false, down: false}

		if (this.keysPressed["ArrowUp"] || this.keysPressed["w"]) directions.up = true
		if (this.keysPressed["ArrowLeft"] || this.keysPressed["a"]) directions.left = true
		if (this.keysPressed["ArrowDown"] || this.keysPressed["s"]) directions.down = true
		if (this.keysPressed["ArrowRight"] || this.keysPressed["d"]) directions.right = true

		if (directions.left && directions.right) {
			directions.left = false
			directions.right = false
		}

		if (directions.up && directions.down) {
			directions.up = false
			directions.down = false
		}

		return directions
	}

	handleMouseDown(event) {
		this.onInputStart(event.pageX, event.pageY)
		event.preventDefault()
	}

	handleMouseMove(event) {
		this.onInputMove(event.pageX, event.pageY)
		event.preventDefault()
	}

	handleMouseUp(event) {
		this.onInputEnd()
		event.preventDefault()
	}

	handleTouchStart(event) {
		var touch = event.touches[0]
		this.onInputStart(touch.pageX, touch.pageY)
		event.preventDefault()
	}

	handleTouchMove(event) {
		var touch = event.touches[0]
		this.onInputMove(touch.pageX, touch.pageY)
		event.preventDefault()
	}

	handleTouchEnd(event) {
		this.onInputEnd()
		event.preventDefault()
	}

	onInputStart(posX, posY) {
		var event = new InputEvent("inputstart", posX, posY)
		window.dispatchEvent(event)

		this.joystick.inputActive = true
		this.joystick.startInputX = posX
		this.joystick.startInputY = posY
	}

	onInputMove(posX, posY) {
		var event = new InputEvent("inputmove", posX, posY)
		window.dispatchEvent(event)

		this.joystick.handleInputMove(posX, posY)
	}

	onInputEnd() {
		var event = new InputEvent("inputend", 0, 0)
		window.dispatchEvent(event)

		this.joystick.reset()
	}
}

class Joystick {
	constructor() {
		this.enabled = false
		this.inputActive = false

		this.startInputX = 0
		this.startInputY = 0

		this.dx = 0
		this.dy = 0

		this.maxLength = 30
		this.sensitivity = 0.5

		this.tiltAngle = 0
		this.tiltPercentage = 0

		this.drawAtInput = true
	}

	handleInputMove(posX, posY) {
		if (!this.inputActive) {
			return
		}

		var dx = (posX - this.startInputX) * this.sensitivity
		var dy = (posY - this.startInputY) * this.sensitivity

		this.processChange(dx, dy)
	}
	
	processChange(dx, dy) {
		if (!this.enabled) {
			return
		}

		if (dx == 0 && dy == 0) {
			this.reset()
			return
		}

		var distance = getDistance(0, 0, dx, dy)

		if (distance < this.maxLength) {
			this.dx = dx
			this.dy = dy
			this.tiltPercentage = distance / this.maxLength
		}
		else {
			// Normalise, then multiply
			var normX = dx / distance
			var normY = dy / distance
			this.dx = normX * this.maxLength
			this.dy = normY * this.maxLength
			this.tiltPercentage = 1
		}

		var radians = Math.atan2(this.dy, this.dx)
		this.tiltAngle = radians
	}

	handleDirections(directions) {
		var dx = 0
		var dy = 0

		if (directions.up) {
			dy = -100
		}

		if (directions.down) {
			dy = 100
		}

		if (directions.left) {
			dx = -100
		}

		if (directions.right) {
			dx = 100
		}

		this.processChange(dx, dy)
	}

	reset() {
		this.inputActive = false
		this.dx = 0
		this.dy = 0
		this.tiltAngle = 0
		this.tiltPercentage = 0
	}

	draw() {
		if (!this.enabled) {
			return
		}

		var offset = 60

		if (this.drawAtInput) {
			var baseX = this.startInputX
			var baseY = this.startInputY
		}
		else {
			var baseX = offset
			var baseY = canvas.height - offset
		}

		var knobX = baseX + this.dx
		var knobY = baseY + this.dy

		var baseSize = 20
		ctx.lineWidth = 4
		ctx.beginPath()
		ctx.arc(baseX, baseY, baseSize, 0, 2 * Math.PI)
		ctx.fillStyle = "white"
		ctx.fill()
		ctx.stroke()

		ctx.lineWidth = 8
		ctx.beginPath()
		ctx.moveTo(baseX, baseY)
		ctx.lineTo(knobX, knobY)
		ctx.stroke()

		var knobSize = 10
		ctx.lineWidth = 4
		ctx.beginPath()
		ctx.arc(knobX, knobY, knobSize, 0, 2 * Math.PI)
		ctx.fillStyle = "red"
		ctx.fill()
		ctx.stroke()
	}
}