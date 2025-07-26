const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
ctx.drawingPerspective = null

var onCanvasResize = () => {}

const baseCanvasResize = () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	onCanvasResize()
}

baseCanvasResize()

window.addEventListener('resize', baseCanvasResize)

const updateControl = (controlID, value) => {
	// TODO: Check if control previously had text like "Score: ${score}", instead of overwriting innerText
	var element = document.getElementById(controlID)
	element.innerText = value
}

const commands = {}

const executeCommand = (commandID) => {
	if (commandID in commands) {
		commands[commandID]()
	}
	else {
		console.error(`No command "${commandID}" found`)
	}
}

const addCommand = (commandID, func) => {
	commands[commandID] = func
}

const storage = {
	activeStorage: "game",

	initialise: (storageName) => storage.activeStorage = storageName,

	getKey: (key) => { return this.activeStorage + "/" + key },

	store: (key, value) => {
		key = storage.getKey(key)
		localStorage.setItem(key, value)
	},

	read: (key, defaultValue = "") => {
		var key = storage.getKey(key)
		var value = localStorage.getItem(key)
	
		if (!value) {
			return defaultValue
		}
	
		return value
	},

	readNumeric: (key, defaultValue = 0) => {
		var value = storage.read(key)

		if (!value) {
			return defaultValue
		}

		var numericValue = parseFloat(value)

		if (!numericValue) {
			return defaultValue
		}

		return numericValue
	}
}

const random = {
	from: (array) => {
		var index = Math.floor(Math.random() * array.length)
		return array[index]
	},

	between: (min, max) => {
		return min + Math.random() * (max - min) 
	}
}

/**
 * @param {number} aX 
 * @param {number} aY 
 * @param {number} bX 
 * @param {number} bY 
 * @returns {number}
 */
const getDistance = (aX, aY, bX, bY) => {
	let dx = aX - bX
	let dy = aY - bY
	return Math.sqrt((dx*dx) + (dy*dy))
}

Object.defineProperty(Array.prototype, 'remove', {
    value: function(item) { 
		var index = this.indexOf(item)

		if (index > -1) {
			this.splice(index, 1)
		}
	}
});