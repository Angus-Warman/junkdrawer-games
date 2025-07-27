class Player extends Entity {
	constructor(controller) {
		super()
		this.controller = controller
		this.controller.joystick.enabled = true

		this.size *= 2
		this.mass *= 2
		this.force *= 2
		this.colour = "red"

		this.items = []
	}

	update() {
		this.moveAtAngleWithPercent(this.controller.joystick.tiltAngle, this.controller.joystick.tiltPercentage)

		for (var entity of game.entities) {
			if (entity == this) {
				continue
			}

			// Collect items
			if (entity.owner === null && entity.overlaps(this)) { // Note triple equals
				this.items.push(entity)
				entity.owner = this
			}
		}
		super.update()
	}
}

class Item extends Entity {
	constructor() {
		super()

		this.owner = null
		this.maxDistanceFromOwner = 30
		this.active = false
		this.mass *= 0.1
		this.size *= 0.5
		this.force *= 0.1
	}

	update() {
		if (this.owner) {
			var distance = this.distanceTo(this.owner)

			if (distance > this.maxDistanceFromOwner) {
				this.moveTowards(this.owner)
			}
		}

		super.update()
	}
}

class ItemCollector extends Entity {
	constructor() {
		super()

		this.shape = new Square()
		this.colour = "green"
		this.collision = false

		this.items = []
	}

	update() {
		if (game.player.overlaps(this)) {
			for (var item of game.player.items) {
				this.items.push(item)
				item.owner = this
			}

			game.player.items = []
		}

		for (var item of this.items) {
			item.maxDistanceFromOwner = 0

			if (this.overlaps(item)) {
				game.removeEntity(item)
				this.items.remove(item)
				this.size += 2
			}
		}
	}
}

class Friend extends Entity {
	constructor() {
		super()
		this.colour = "purple"
		this.size *= 3
		this.mass *= 2
		this.angle = 0
		this.angleDelta = 0.1
	}

	update() {
		this.moveAtAngle(this.angle)
		if (random.between(0, 100) < 1) {
			this.angleDelta *= -1
		}
		this.angle += this.angleDelta

		super.update()
	}
}

class BaeMartGame extends Game {
	constructor() {
		super()

		this.player = new Player(this.controller)
		ctx.drawingPerspective = this.player
		this.addEntity(this.player)

		for (var i = 0; i < 100; i++) {
			var bread = new Item()
			bread.x = random.between(-1000, +1000)
			bread.y = random.between(-1000, +1000)
			bread.colour = "brown"
			this.addEntity(bread)
		}

		var beachball = new Entity()
		beachball.x = -500
		beachball.mass *= 0.1
		beachball.friction *= 0.5
		beachball.size *= 10
		beachball.colour = "blue"
		this.addEntity(beachball)

		var friend = new Friend()
		friend.y = 500
		this.addEntity(friend)

		var deposit = new ItemCollector()
		deposit.x = 500 
		deposit.y = 0
		this.entities.push(deposit)
		
		var block = new Entity()
		block.shape = new Square()
		block.colour = "black"
		block.size *= 10
		block.mass *= 10
		block.y = -500
		this.addEntity(block)
	}
}

const game = new BaeMartGame()
window.onload = game.start()