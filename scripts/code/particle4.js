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

const logEm = (a) =>
    a.map( ({position}) => {
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

let particles = Array(2)
    .fill(true)
    .map(_ => particle())

const FRICTION = .2

const app = () => {
    let p = 0
    const {obs, rAF} = clanFp
        , pipeline = obs([])
        , refresh = ps => pipeline(ps)
        , positions = [[0,0], [1000,0], [1000,1000], [0,1000]]
        , nextPos = $ => positions[p++ % 4]
        , mouse = nextPos()
        , applyGravity = ps =>
            pipeline(
                ps.map(p =>
                    applyForce(
                        p
                        , 1
                        , normalize(sub(mouse, p.position))
                    )))

    // game loop
    pipeline
        .debounce(16)
        .map(ps =>
            ps.map(p => update(p, FRICTION)))
        .then(ps => {
            reset()
            log(new Date)
            logEm(ps)
        })
        .then(ps => rAF($ => refresh(ps)))
        // .then(ps => applyGravity(ps))

    // setInterval($ => applyGravity(pipeline()), 1000)
    // setInterval($ => nextPos(), 10000)

    pipeline(particles)
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
