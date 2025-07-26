const UPDATE_DELAY = 10
var gameSize = Math.min(canvas.width, canvas.height) * 0.9
var squareSize = gameSize / 8

const STATE = {
	EMPTY: "empty",
	PIECE: "piece",
	HOVER: "pending",
	PLACED: "placed",
	FULL: "full"
}

class Coords {
	constructor(x, y) {
		this.x = x
		this.y = y
	}

	equals(other) {
		return this.x == other.x && this.y == other.y
	}

	add(other) {
		this.x += other.x
		this.y += other.y
	}
}

class Square {
	constructor(coordX, coordY) {
		this.coordX = coordX
		this.coordY = coordY
		this.state = STATE.EMPTY
		this.drawState = STATE.EMPTY

		this.dx = 0
		this.dy = 0
	}

	get x() {
		return this.coordX * squareSize + this.dx
	}

	get y() {
		return this.coordY * squareSize + this.dy
	}

	get centreX() {
		return this.x + squareSize / 2
	}

	get centreY() {
		return this.y + squareSize / 2
	}

	update() {
		this.drawState = this.state
	}

	draw() {
		ctx.beginPath()
		ctx.moveTo(this.x, this.y)
		ctx.lineTo(this.x, this.y + squareSize)
		ctx.lineTo(this.x + squareSize, this.y + squareSize)
		ctx.lineTo(this.x + squareSize, this.y)
		ctx.lineTo(this.x, this.y)
		ctx.stroke()

		switch (this.drawState) {
			case STATE.EMPTY:
				ctx.fillStyle = "transparent"
				break
			case STATE.PIECE:
				ctx.fillStyle = "green"
				break
			case STATE.HOVER:
				ctx.fillStyle = "dodgerblue"
				break
			case STATE.PLACED:
				ctx.fillStyle = "blue"
				break
			case STATE.FULL:
				ctx.fillStyle = "red"
				break
		}

		ctx.fill()
	}

	touches(otherSquare) {
		var x = this.x
		var y = this.y
		
		if (otherSquare.contains(x, y)) {
			return true
		}
		else if (otherSquare.contains(x + squareSize, y)) {
			return true
		}
		else if (otherSquare.contains(x, y + squareSize)) {
			return true
		}
		else if (otherSquare.contains(x + squareSize, y + squareSize)) {
			return true
		}

		return false
	}

	overlaps(otherSquare) {
		return otherSquare.contains(this.centreX, this.centreY)
	}

	contains(posX, posY) {
		return posX > this.x &&
				posX < (this.x + squareSize) &&
				posY > this.y &&
				posY < (this.y + squareSize)
	}
}

class Segment {
	constructor() {
		this.squares = []
	}

	update() {
		if (this.isPendingFull) {
			for (var square of this.squares) {
				square.drawState = STATE.FULL
			}
		}
	}

	get isPendingFull() {
		var isPendingFull = true

		for (var square of this.squares) {
			if (square.state != STATE.PLACED && square.drawState != STATE.HOVER && square.drawState != STATE.FULL) {
				isPendingFull = false
				break
			}
		}

		return isPendingFull
	}

	get isFull() {
		var isFull = true

		for (var square of this.squares) {
			if (square.state != STATE.PLACED) {
				isFull = false
				break
			}
		}

		return isFull
	}

	clear() {
		for (var square of this.squares) {
			square.state = STATE.EMPTY
		}
	}
}

class Board {
	constructor() {
		this.squares = []
		this.rows = []
		this.columns = []

		for (var i = 0; i < 8; i++) {
			this.rows.push(new Segment())
			this.columns.push(new Segment())
		}

		for (var coordX = 0; coordX < 8; coordX++) {
			for (var coordY = 0; coordY < 8; coordY++) {
				var square = new Square(coordX, coordY)
				this.squares.push(square)

				this.rows[coordY].squares.push(square)
				this.columns[coordX].squares.push(square)
			}
		}

		this.segments = this.rows.concat(this.columns)

		this.alignCentre()
	}

	draw() {
		for (var square of this.squares) {
			square.draw()
		}
	}

	alignCentre() {
		var boardSize = squareSize * 8
		var dx = (canvas.width - boardSize) / 2
		var dy = (canvas.height - boardSize) / 5

		for (var square of this.squares) {
			square.dx = dx
			square.dy = dy
		}
	}

	tryGetEmptySquaresUnderPiece(piece) {
		var overlapSquares = []

		for (var square of piece.squares) {
			var overlapSquare = tryGetOverlapSquare(square, this.squares)

			if (!overlapSquare) {
				return null
			}

			if (overlapSquare.state == STATE.PLACED) {
				return null
			}

			overlapSquares.push(overlapSquare)
		}

		return overlapSquares
	}
}

class Piece {
	constructor(coords) {
		this.coords = coords
		this.squares = []

		for (var c of coords) {
			var square = new Square(c.x, c.y)
			square.state = STATE.PIECE
			square.drawState = STATE.PIECE
			this.squares.push(square)
		}

		this.dx = 0
		this.dy = 0
	}

	draw() {
		for (var square of this.squares) {
			square.draw()
		}
	}

	contains(x, y) {
		for (var square of this.squares) {
			if (square.contains(x, y)) {
				return true
			}
		}

		return false
	}

	move(dx, dy) {
		this.dx = dx
		this.dy = dy

		for (var square of this.squares) {
			square.dx = dx
			square.dy = dy
		}
	}

	moveRandom() {
		var margin = 0.9

		var minX = canvas.width * margin
		var maxX = canvas.width * (1 - margin)
		var minY = canvas.height * margin
		var maxY = canvas.height * (1 - margin)

		var dx = random.between(minX, maxX)
		var dy = random.between(minY, maxY)

		this.move(dx, dy)
	}
}

class BaetrisGame {
	constructor() {
		storage.initialise("baetris")

		this.board = new Board()
		this.score = 0
		this.pieces = []

		this.loadState()

		if (this.pieces.length == 0) {
			this.addRandomPiece()
			this.addRandomPiece()
			this.addRandomPiece()
			this.adjustPiecePlacement()
		}

		this.highScore = storage.readNumeric("highscore", 0)
		
		this.controller = new Controller()
		
		window.addEventListener("inputstart", this.startDrag.bind(this))
		window.addEventListener("inputmove", this.continueDrag.bind(this))
		window.addEventListener("inputend", this.endDrag.bind(this))

		this.dragOperation = null

		this.updateScores()

		addCommand('restart', this.restart.bind(this))
	}

	saveState() {
		var state = { board: this.board, pieces: this.pieces, score: this.score }
		var stateString = JSON.stringify(state)
		storage.store("gamestate", stateString)
	}

	loadState() {
		var stateString = storage.read("gamestate")

		if (stateString) {
			var state = JSON.parse(stateString)

			this.score = state.score

			for (var i = 0; i < 64; i++) {
				this.board.squares[i].state = state.board.squares[i].state
			}

			for (var storedPiece of state.pieces) {
				var piece = new Piece(storedPiece.coords)
				piece.move(storedPiece.dx, storedPiece.dy)
				this.pieces.push(piece)
			}

			this.adjustPiecePlacement()
		}
	}

	restart() {
		this.board = new Board()
		this.score = 0

		this.pieces = []
		this.addRandomPiece()
		this.addRandomPiece()
		this.addRandomPiece()
		this.adjustPiecePlacement()

		this.updateScores()
		this.saveState()
	}

	start() {
		this.animation = requestAnimationFrame(this.draw.bind(this))
		this.updateInterval = setInterval(this.update.bind(this), UPDATE_DELAY)
	}

	stop() {
		cancelAnimationFrame(this.animation)
		clearInterval(this.updateInterval)
	}

	draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		this.board.draw()

		for (var piece of this.pieces) {
			piece.draw()
		}

		this.animation = requestAnimationFrame(this.draw.bind(this))
	}

	update() {
		for (var square of this.board.squares) {
			square.update()
		}

		for (var piece of this.pieces) {
			var boardPieces = this.board.tryGetEmptySquaresUnderPiece(piece)

			if (!boardPieces) {
				continue
			}

			for (var square of boardPieces) {
				square.drawState = STATE.HOVER
			}
		}

		for (var segment of this.board.segments) {
			segment.update()
		}

		// Check all segment states before clearing 
		var fullSegments = this.board.segments.filter(s => s.isFull)

		for (var segment of fullSegments) {
			segment.clear()
			this.score++
			this.updateScores()
		}
	}

	updateScores() {
		if (this.score > this.highScore) {
			this.highScore = this.score
			storage.store("highscore", this.highScore)
		}

		updateControl("score", this.score)
		updateControl("highscore", this.highScore)
	}

	startDrag(event) {
		var posX = event.posX
		var posY = event.posY

		for (var piece of this.pieces) {
			if (piece.contains(posX, posY)) {
				this.dragOperation = {
					piece: piece, 
					dragStart: {x: posX, y: posY}, 
					pieceStart: {x: piece.dx, y: piece.dy}
				}

				return
			}
		}
	}

	continueDrag(event) {
		var posX = event.posX
		var posY = event.posY

		if (!this.dragOperation) {
			return
		}

		var deltaX = posX - this.dragOperation.dragStart.x
		var deltaY = posY - this.dragOperation.dragStart.y

		var newX = this.dragOperation.pieceStart.x + deltaX
		var newY = this.dragOperation.pieceStart.y + deltaY

		this.dragOperation.piece.move(newX, newY)
	}

	endDrag() {
		if (!this.dragOperation) {
			return
		}

		var piece = this.dragOperation.piece

		var boardPieces = this.board.tryGetEmptySquaresUnderPiece(piece)

		if (boardPieces) {
			for (var square of boardPieces) {
				square.state = STATE.PLACED
			}

			this.pieces.remove(piece)

			this.addRandomPiece()
			this.adjustPiecePlacement()
			this.saveState()
		}

		this.dragOperation = null
	}

	getSizeOfNewPiece() {
		var chance = random.between(0, this.score + 30)

		if (chance < 5) {
			return 3
		}

		if (chance < 30) {
			return 4
		}

		if (chance < 50) {
			return 5
		}

		if (chance < 100) {
			return 6
		}
	}

	addRandomPiece() {
		var numSquares = this.getSizeOfNewPiece()

		var coords = [new Coords(0, 0)]

		var directions = [new Coords(+1, 0), new Coords(0, +1), new Coords(-1, 0), new Coords(0, -1)]

		while (coords.length < numSquares) {
			var startCoords = random.from(coords)
			var newCoords = new Coords(startCoords.x, startCoords.y)
			var direction = random.from(directions)
			newCoords.add(direction)

			if (!coords.some(e => e.equals(newCoords))) {
				coords.push(newCoords)
			}
		}

		var newPiece = new Piece(coords)

		newPiece.moveRandom()

		this.pieces.push(newPiece)
	}

	adjustPiecePlacement() {
		for (var i = this.pieces.length - 1; i >= 0; i--) { // Reverse order, shift placement of new pieces first
			var piece = this.pieces[i]
			var allSquares = [... this.board.squares]

			for (var otherPiece of this.pieces) {
				if (piece != otherPiece) {
					allSquares.push(...otherPiece.squares)
				}
			}

			var placementValid = () => {
				var noOverlaps = !anyTouchingSquares(piece.squares, allSquares)
				var allInBounds = !anyOutOfBounds(piece.squares, 0, canvas.width, 0, canvas.height)
				return noOverlaps && allInBounds
			}

			if (placementValid()) {
				continue
			}

			var searching = true
			var maxSteps = 100

			while (searching && maxSteps-- > 0) {
				piece.moveRandom()

				if (placementValid()) {
					searching = false
				}
			}
		}
	}

	onResize() {
		this.board.alignCentre()
		this.adjustPiecePlacement()
	}
}

function tryGetOverlapSquare(square, otherSquares) {
	for (var otherSquare of otherSquares) {
		if (square.overlaps(otherSquare)) {
			return otherSquare
		}
	}

	return null
}

function anyTouchingSquares(squares, otherSquares) {
	for (var square of squares) {
		for (var otherSquare of otherSquares) {
			if (square.touches(otherSquare)) {
				return true
			}
		}
	}

	return false
}

function anyOutOfBounds(squares, minX, maxX, minY, maxY) {
	for (var square of squares) {
		var centreX = square.centreX
		var centreY = square.centreY

		if (centreX < minX || centreX > maxX || centreY < minY || centreY > maxY) {
			return true
		}
	}

	return false
}

const game = new BaetrisGame()
window.onload = game.start()

onCanvasResize = () => {
	gameSize = Math.min(canvas.width, canvas.height) * 0.9
	squareSize = gameSize / 8
	game.onResize()
}