const random = (min=0, max=400) =>
    Math.random()*(max-min)+min

const vector = (x=random(),y=random()) => [x,y]

const degToRad = deg => deg * Math.PI / 180

const radToDeg = rad => rad*180 / Math.PI

const add = (...vx) =>
    vx.reduce((a, v) =>
        [a[0] + v[0], a[1] + v[1]], [0,0])

const sub = (...vx) =>
    vx.reduce((a, v) =>
        [a[0] - v[0], a[1] - v[1]])

const scale = ([x,y],n) =>
    [n * x, n * y]

const dot = ([x1,y1],[x2,y2]) =>
    x1*x2 + y1*y2

const rotate = ([x,y],deg) => {
    let r = degToRad(deg),
        [cos, sin] = [Math.cos(r), Math.sin(r)]
    return [cos*x - sin*y, sin*x + cos*y]
}

const normalize = v => scale(v,1/(mag(v) || 1))

const mag = ([x,y]) => Math.sqrt(x*x + y*y)

const dist = ([x1,y1], [x2,y2]) =>
    Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2))

const heading = (v) => {
    let angle = angleBetween(v,[0,-1*mag(v)])
    return v[0] < 0 ? 360-angle : angle
}

const angleBetween = (v1,v2) =>
    radToDeg(Math.acos( dot(v1,v2) / (mag(v1)*mag(v2)) ))

const particle = (
    position=vector(),
    velocity=vector(),
    accel=vector()
) => {
    return {accel, velocity, position}
}

// velocity += accel_______
// velocity *= 1-friction _|---> part a
// position += velocity--------> part b
const update = (p, friction) => {
    let [[px,py], [vx,vy], [ax,ay]] = [p.position, p.velocity, p.accel]
    vx = (vx+ax) * (1-friction)
    vy = (vy+ay) * (1-friction)
    let position = [px + vx, py + vy],
        accel = [0,0],
        velocity = [vx,vy]
    return { ...p, position, accel, velocity }
}

// f(particle, number, vector) -> vector
const applyForce = (p, m, a) => {
    let {accel} = p
    accel = add(accel, scale(a,m))
    return { ...p, accel }
}

const looper = fn => {
    let cb = (time) => {
        requestAnimationFrame(cb)
        let diff = ~~(time - (cb.time || 0)),
            seconds_passed = diff/1000
        fn(seconds_passed)
        cb.time = time
    }
    return cb
}

/**
 * LET THE REVOLUTION BEGIN
 *
 * GIMME THE JUITH!
 */

let canvas = document.createElement('canvas'),
    c = canvas.getContext('2d')

document.body.appendChild(canvas)

const setSize = () => {
    canvas.width = document.body.offsetWidth
    canvas.height = document.body.offsetHeight
}
setSize()
window.onresize = setSize

// define particles

const plane = (image=0) => {
    let x = random(0,canvas.width),
        y = random(0,canvas.height)
    return {...particle([x,y], [0,0], [0,0]), image:image%6, mass: random(500,5000)}
}

let planes = Array(50).fill(true).map((v,i) =>
    plane(i))

// the input
let keys = { 38: 'up', 37: 'left', 39: 'right', 40: 'down' },
    pressed = {}

window.addEventListener('keydown', ({keyCode}) => {
    pressed[keys[keyCode]] = true
})
window.addEventListener('keyup', ({keyCode}) => {
    pressed[keys[keyCode]] = false
})
let nums = { 49: 0, 50: 1, 51: 2, 52: 3, 53: 4 }
window.addEventListener('keypress', ({keyCode}) => {
    planes = planes.map(p => {
        return {...p, image: nums[keyCode] || 0}
    })
})


/**
 * PHYSICS UPDATES
 */

const WORLD_FRICTION = 0.01
looper(seconds => {
    // update plane positions
    planes = planes.map(p => update(p, seconds, WORLD_FRICTION))
})()

let MAX_SPEED = () => (pressed.left || pressed.right) ? canvas.width / 2 : canvas.width

looper(seconds => {
    // zip! zoom! swoosh!
    //
    planes = planes.map(p => {
        let [x,y] = p.position,
            {velocity} = p

        if(x < 0){
            x = canvas.width
        } else if (x > canvas.width){
            x = 0
        }

        if(y < 0){
            y = canvas.height
        } else if (y > canvas.height){
            y = 0
        }

        if(mag(velocity) > MAX_SPEED()*seconds){
            acceleration = [0,0]
        }

        return { ...p, position: [x,y], velocity }
    })

    // apply forces based on keys that are pressed
    planes = planes.map(p => {

        let {velocity, mass} = p
        if(mag(velocity) === 0){
            velocity = [1,0]
        }

        if(pressed.left) {
            let left_vec = rotate(normalize(velocity), -90)
            p = applyForce(p, 5000/p.mass, scale(left_vec, seconds))
        }

        if(pressed.right) {
            let right_vec = rotate(normalize(velocity), 90)
            p = applyForce(p, 5000/p.mass, scale(right_vec, seconds))
        }

        if(pressed.up) {
            p = applyForce(p, 12500/p.mass, scale(normalize(velocity), seconds))
        }

        return p
    })
})()

/**
 * DRAW UPDATES
 */

let img = new Image()
img.src = 'https://matthiasak.github.io/fullstack-london-oct-2015/images/main.png'
let image_sizes = (x,y,index,o=48) => {
    return [64*index,0,64,64,x-o/2,y-o/2,o,o]
}

img.onload = looper(t => {
    // draw white bg
    c.fillStyle = '#fff'
    c.fillRect(0,0,canvas.width,canvas.height)

    // draw plane
    planes.forEach(p => {
        let {position} = p,
            [x,y] = position

        // draw plane
        let h = heading(p.velocity)
        if(h === NaN) h = 90
        let rad = degToRad(h-90)

        c.translate(x,y)
        c.rotate(rad)
        c.drawImage(img, ...image_sizes(0, 0, p.image))
        c.rotate(-1*rad)
        c.translate(25,40)
        c.rotate(rad)
        c.globalAlpha = .2
        c.drawImage(img, ...image_sizes(0, 0, p.image, 32))
        c.globalAlpha = 1


        // reset current transformation matrix to the identity matrix
        c.setTransform(1, 0, 0, 1, 0, 0)
    })
})