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

const orb = (mass, ...rest) => {
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

const FRICTION = 0.1

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

    //------> MOUSE / INPUT
    const mouse =
        obs()
        .from(fn => window.addEventListener('mousedown', fn)) // try 'mousemove' :)
        .map(({clientX, clientY}) => [clientX, clientY])
        .then(([x,y]) =>
            pipeline(
                pipeline().concat(orb(random(10,100), [x,y]))))

    const pipeline = obs()
        , refresh = ps => pipeline(ps)
        , render = ps => rAF($ => refresh(ps))
        , applyPhysics = ps => ps.map(p => update(p, FRICTION))
        , applyGravity = ps =>
            pipeline(
                ps.map(p =>
                    applyForce(
                        p
                        , 1
                        , [0,3.2]
                    )))
        , detectBoundaries = ps =>
            ps.map(p => {
                if((p.position[1] + .5*p.mass) >= canvas.height) {
                    p.position[1] = canvas.height - .5*p.mass
                    p.velocity = [p.velocity[0], p.velocity[1]*-1]
                }
                if((p.position[0] - .5*p.mass) < 0) {
                    p.position[0] = .5*p.mass
                    p.velocity[0] = p.velocity[0]*-1
                }
                if((p.position[0] + .5*p.mass) > canvas.width) {
                    p.position[0] = canvas.width - .5*p.mass
                    p.velocity[0] = p.velocity[0]*-1
                }
                return p
            })
        , detectCollisions = ps => {
            for(let i = 0, len = ps.length; i < len; i++){
                let p1 = ps[i]
                for(let j = 0, len = ps.length; j < len; j++){
                    let p2 = ps[j]
                    if(p1 === p2) continue
                    let distance = mag(sub(p2.position, p1.position))

                    if(distance < (p2.mass+p1.mass)/2){
                        // transfer energy?
                        let {velocity: p1v, position: p1p} = p1
                            , {velocity: p2v, position: p2p} = p2

                        // direction away from collision
                        let diff = normalize(sub(p1.position, p2.position))
                        ps[i] = applyForce(p1, p2.mass * .1, scale(diff, 1))
                    }
                }
            }
        }
        , draw = ps => {
            c.fillStyle = '#000'
            c.fillRect(0,0,canvas.width,canvas.height)

            // draw particles
            c.fillStyle = 'red'
            for(let i = 0, len = ps.length; i < len; i++){
                let {position, mass} = ps[i]
                let [x,y] = position
                c.beginPath()
                c.arc(x, y, mass/2, 0, 2*Math.PI)
                c.fill()
            }
        }

    // game loop
    pipeline
        .debounce(16)
        .map(applyPhysics)
        .map(detectBoundaries)
        .then(render)
        .then(draw)
        .then(applyGravity)
        .then(detectCollisions)

    pipeline([])
    mouse([0,0])
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
