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

const add = (...vx) =>
    vx.reduce((a, v) =>
        [a[0] + v[0], a[1] + v[1]], [0,0])

const scale = ([x,y],n) => [n * x, n * y]

const logEm = (a) =>
    a.map( ({position}) => {
          log(`x: ${position[0]}`)
          log(`y: ${position[1]}`)
          log(`-----------`)
    })

const random = (min=0, max=400) =>
    Math.random()*(max-min)+min

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
    const {obs, rAF} = clanFp
        , pipeline = obs([])
        , refresh = ps => pipeline(ps)
        , applyGravity = ps =>
            pipeline(
                ps.map(p =>
                    applyForce(
                        p
                        , 1
                        , [0,-1]
                        // , [random(-50,50),random(-50,50)]
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

    setInterval($ => applyGravity(pipeline()), 3000)

    pipeline(particles)
}

require('clan-fp@0.0.58').then(app)
