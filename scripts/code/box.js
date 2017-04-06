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
    position=[random(), random()],
    velocity=[0,0],
    accel=[0,0]
) => {
    let o = Object.create(null)
    o.accel = accel
    o.velocity = velocity
    o.position = position
    return o
}

const box = (mass=random(5, 50), ...rest) => {
    let o = particle(...rest)
    o.mass = mass
    return o
}

const logEm = (a) =>
    a.map(({position}) => {
          log(`x: ${position[0]}`)
          log(`y: ${position[1]}`)
          log(`-----------`)
    })

const update = (p, friction=1) => {
    let [[px,py], [vx,vy], [ax,ay]] =
        [p.position, p.velocity, p.accel]

    vx = vx+ax
    vy = vy+ay

    let f = 1-friction,
        position = [px + vx, py + vy],
        accel = [ax * .1, ay * .1],
        velocity = [vx * f,vy * f]

    p.position = position
    p.accel = accel
    p.velocity = velocity
    return p
}

const applyForce = (p, m, a) => {
    let {accel} = p
    p.accel = add(scale(a,m), accel)
    return p
}

let particles = Array(200)
    .fill(true)
    .map(_ => box())

const FRICTION = .1

let canvas = document.createElement('canvas'),
    c = canvas.getContext('2d')

document.body.appendChild(canvas)

const setSize = () => {
    canvas.width = document.body.offsetWidth
    canvas.height = document.body.offsetHeight
}
setSize()
window.onresize = setSize

const app = () => {
    let p = 0
    const {obs, rAF} = clanFp
        , pipeline = obs([])
        , refresh = ps => pipeline(ps)
        , positions = [[0,0], [canvas.width,0], [canvas.width,canvas.height], [0,canvas.height]]
        , nextPos = $ => positions[p++ % 4]
        , mouse = obs(nextPos())
        , applyGravity = ps =>
            pipeline(
                ps.map(p =>
                    applyForce(
                        p
                        , 20 / p.mass
                        , normalize(sub(mouse(), p.position))
                    )))
        , draw = ps => {
            c.fillStyle = '#000'
            c.fillRect(0,0,canvas.width,canvas.height)
            // draw particles
            c.fillStyle = '#ccc'
            for(let i = 0, len = ps.length; i < len; i++){
                let {position, mass} = ps[i]
                    , [x,y] = position
                c.fillRect(x-mass/2,y-mass/2,mass,mass)
            }

            // draw mouse
            c.fillStyle = 'hotpink'
            let mouse_size = 30,
                half = mouse_size/2,
                [x,y] = mouse()
            c.fillRect(x-half,y-half,mouse_size,mouse_size)
        }

    // game loop
    pipeline
        .debounce(16)
        .map(ps =>
            ps.map(p => update(p, FRICTION)))
        .then(ps => rAF($ => refresh(ps)))
        .then(draw)
        .then(ps => applyGravity(ps))

    setInterval($ => mouse(nextPos()), 4000)

    pipeline(particles)
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
