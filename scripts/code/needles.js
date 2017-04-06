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


const FRICTION = .1

const app = () => {
    const {obs, rAF} = clanFp

    // canvas resizing
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

    //------> Particles
    let cols = ~~(canvas.width/30),
        rows = ~~(canvas.height/30)

    let particles =
        Array(cols*(rows+2)*(cols+2))
        .fill(true)
        .map((v,i,arr) => {
            let w = canvas.width,
                h = canvas.height
            return particle(
                [
                    (w/cols)*(i%(cols+1)),
                    (h/rows)*~~(i/(cols+1))
                ],
                [0,0],
                [0,0])
        })

    //------> MOUSE / INPUT
    const mouse =
        obs()
        .from(fn => window.addEventListener('mousemove', fn))
        .map(({clientX, clientY}) => [clientX, clientY])
    mouse([0,0])

    const pipeline = obs()
        , refresh = ps => pipeline(ps)
        , draw = ps => {

            // draw background
            c.fillStyle = '#000'
            c.fillRect(0,0,canvas.width,canvas.height)

            // draw particles
            c.strokeStyle = '#ccc'
            c.lineWidth = 1
            c.lineCap = 'round'

            for(let i = 0, len = ps.length; i < len; i++){
                let {position, mass} = ps[i]
                c.beginPath()
                let [x,y] = position,
                    diff = sub(mouse(), position),
                    n = scale(normalize(diff), 20),
                    lineWidth = Math.min(
                        Math.max(
                            ~~(canvas.width / mag(diff)),
                            1
                        ),
                    100)

                c.lineWidth = lineWidth
                c.moveTo(x,y)
                c.lineTo(...add(position,n))
                c.stroke()
                c.closePath()
            }
        }

    // game loop
    pipeline
        .debounce(16)
        .map(ps =>
            ps.map(p => update(p, FRICTION)))
        .then(ps => rAF($ => refresh(ps)))
        .then(draw)

    pipeline(particles)
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
