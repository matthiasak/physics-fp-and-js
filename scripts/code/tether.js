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

const ball = (mass=50) => {
    let rw = random(0,canvas.width),
        rh = random(0,canvas.height)
    return {
        ...particle([rw,rh], [0,0], [0,0]),
        mass
    }
}

let balls = Array(1).fill(true).map(_ => ball())
let points = Array(3).fill(true).map(_ => ball(10))

// the mouse
let mouse = [0,0],
    down  = false

window.addEventListener('mousemove', ({clientX, clientY}) => {
    mouse = [clientX, clientY]

    if(down!==false)
        points[down].position = mouse
})

const contains = (bounds, point) =>
    point[0] >= bounds[0][0]
    && point[1] >= bounds[0][1]
    && point[0] <= bounds[1][0]
    && point[1] <= bounds[1][1]

window.addEventListener('mousedown', () => {
    points.forEach((p, i) => {
        let {position, mass} = p,
            [x,y] = position,
            r = mass/2

        if(contains([[x-r, y-r], [x+r, y+r]], mouse)){
            down = i
        }
    })
})

window.addEventListener('mouseup', () =>
    down = false)

/**
 * PHYSICS UPDATES
 */

const WORLD_FRICTION = 0.1
looper(time => {
    balls = balls.map(p =>
        update(p, WORLD_FRICTION))
})()

looper(time => {
    points = points.map(p => {
        balls = balls.map(b => {
            // apply force in direction of each point
            return applyForce(
                b,
                time,
                scale(
                    normalize(sub(p.position, b.position)),
                    mag(sub(p.position, b.position))
                )
            )
        })
        return p
    })
})()

/**
 * DRAW UPDATES
 */

// draw every 16ms
looper(t => {
    c.clearRect(0,0,canvas.width,canvas.height)
    // draw points
    c.fillStyle = '#888'
    points.forEach(({position, mass}, i, arr) => {
        let [x,y] = position

        c.strokeStyle = '#fff'
        c.strokeWidth = 2
        balls.forEach(({position, mass}, i, arr) => {
            c.beginPath()
            c.moveTo(x,y)
            // log(x, y, position)
            c.lineTo(...position)
            c.stroke()
            c.closePath()
        })

        c.beginPath()
        c.arc(x, y, mass/2, 0, 2*Math.PI)
        c.fill()
        c.closePath()
    })

    // draw ball
    c.fillStyle = 'red'
    balls.forEach(({position, mass}, i, arr) => {
        let [x,y] = position
        c.beginPath()
        c.arc(x, y, mass/2, 0, 2*Math.PI)
        c.fill()
        c.closePath()
    })
})()