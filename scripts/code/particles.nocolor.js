//------> MATH

const vector = (x=random(),y=random()) => [x,y]

const degToRad = deg => deg * Math.PI / 180

const radToDeg = rad => rad*180 / Math.PI

const add = (...vx) =>
    vx.reduce((a, v) =>
        [a[0] + v[0], a[1] + v[1]], [0,0])

const sub = (...vx) =>
    vx.reduce((a, v) =>
        [a[0] - v[0], a[1] - v[1]])

const scale = ([x,y],n) => [n * x, n * y]

const dot = ([x1,y1],[x2,y2]) => x1*x2 + y1*y2

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

//------> LOGIC / MODELING

const random = (min=0, max=400) =>
    Math.random()*(max-min)+min

const within = (min, max, x) =>
    Math.max(Math.min(x, max), min)

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

// velocity += accel_______
// velocity *= 1-friction _|---> part a
// position += velocity--------> part b
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

// force = m*a
const applyForce = (p, m, a) => {
    let {accel} = p
    p.accel = add(scale(a,m), accel)
    return p
}

//-------> SIMULATE

const box = (mass=random(2,5)) => {
    let p = particle()
    p.mass=mass
    return p
}

let particles = Array(15000)
    .fill(true)
    .map(_ => box())

const FRICTION = .2

//-------> GAME ENGINE

console.clear()
const app = () => {
    const {hamt, obs, worker, cof, cob, concatter, filtering, mapping, pf, rAF} = clanFp

    const pipeline = obs([])
        , refresh = ps => pipeline(ps)

    let d = +new Date
        , diff

    // game loop
    pipeline
        .debounce(16)
        .map(ps =>
            ps.map(p => update(p, FRICTION)))
        .then(ps => {
            let _d = +new Date //new date
            diff = ~~(_d - (d || 0)) // calculate the span b/w now and last time
            d = _d // update timestamp

            // text updates
            // reset()
            // logEm(ps)
            // log(new Date, 'rendering: '+diff+'ms')
        })
        .then(ps => rAF(refresh.bind(null, ps)))
        .then(ps => draw(ps))
        // .debounce(2000)
        // .then(ps =>
        // pipeline(
        // ps.map(p =>
        // applyForce(
        // p
        // , 1
        // , [random(-1,1),random(-1,1)]
        // ))))

        .debounce(16)
        .then(ps =>
            pipeline(
                ps.map(p => {
                    let dist = sub(mouse(), p.position)
                        , dir = normalize(dist)
                    return applyForce(
                        p
                        , 50 / p.mass//* diff/1000
                        , dir
                    )
                })))

    //--------> CANVAS

    const canvas = document.createElement('canvas'),
        c = canvas.getContext('2d')

    document.body.appendChild(canvas)

    const size =
        obs()
        .from(fn => {window.onresize = fn})

    const s =
        size
        .map(x => [document.body.offsetWidth, document.body.offsetHeight])
        .then(([x,y]) => {
            canvas.width = x
            canvas.height = y
        })

    size(true)

    //------> MOUSE / INPUT

    const mouse =
        obs()
        .from(fn => window.addEventListener('mousemove', fn))
        .map(({clientX, clientY}) => [clientX, clientY])

    mouse([0,0])

        // mouse
        // .then(reset)
        // .then(log)

    let rgb = color('red')
    const draw = ps => {
        // draw pink box
        // c.globalAlpha = .5
        c.fillStyle = '#000'
        c.fillRect(0,0,canvas.width,canvas.height)
        // c.globalAlpha = 1

        // draw particles
        c.fillStyle = '#ccc'

        for(let i = 0, len = ps.length; i<len; i++){
            let {position,mass} = ps[i]
                , [x,y] = position

            // c.fillStyle =
                // rgb
                // .mix(color('purple'), mag(sub(mouse(), position))/mag(s()))

            c.fillRect(x-mass/2,y-mass/2,mass,mass)
        }

        // draw mouse
        // c.fillStyle = 'red'
        // let mouse_size = 30,
        //     half = mouse_size/2,
        //     [x,y] = mouse()
        // c.fillRect(x-half,y-half,mouse_size,mouse_size)
    }

    const click =
        obs()
        .from(fn => window.addEventListener('mousedown',fn))
        .debounce(16)
        .then($ =>
              pipeline(pipeline().map(p => applyForce(p, p.mass, vector(random(-20,20), random(-20,20))))))

    // setInterval($ => click(true), 1000)

    pipeline(particles)
}

require('clan-fp@0.0.58', 'color').then(app)