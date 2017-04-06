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
    let [[px,py], [vx,vy], [ax,ay]] =
        [p.position, p.velocity, p.accel]

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

const link = (size=2, [px,py]) => {
    let links = Array(size)
        .fill(true)
        .map((p,i) =>
            particle(
                [px, i*40+py],
                [0,0],
                [0,0])
    )

    return {
        ...particle([px,py],[0,0],[0,0]),
        links
    }
}

let chains = Array(2)
    .fill(true)
    .map(_ =>
        link(8, [random(), 0]))

// the mouse
//
let mouse = [0,0]
window.addEventListener('mousemove',
    ({clientX, clientY}) =>
        mouse = [clientX, clientY])

/**
 * PHYSICS UPDATES
 */

const WORLD_FRICTION = 0.01
looper(time => {
    chains = chains.map(l => {
        let {links} = l
        links = links.map((l,i) => {
            if(i == 0) return l
            return update(l, time, WORLD_FRICTION)
        })
        return {...l, links}
    })
})()

looper(time => {
    // gravity
    chains = chains.map(l => {
        let {links} = l
        links = links.map((l,i,arr) => {
            if(i === 0) return l
            return applyForce(l, time, [0,32.174])
        })
        return {...l, links}
    })
})()

looper(time => {
    // run away from the mouse
    chains = chains.map(l => {
        let {links} = l
        links = links.map((l,i) => {
            if(i === 0) return l
            if(mag(sub(l.position, mouse)) < 100) {
                return applyForce(l, 1,
                    normalize(sub(l.position, mouse)))
            }
            return l
        })
        return {...l, links}
    })
})()

looper(time => {
    // pull back to parent links
    chains = chains.map(l => {
        let {links} = l
        links = links.map((l,i,arr) => {
            if(i === 0) return l
            return applyForce(l, .5,
                normalize(sub(arr[i-1].position, l.position)))
        })
        return {...l, links}
    })
})()

looper(time => {
    // max spring length
    chains = chains.map(l => {
        let {links} = l
        links = links.map((l,i,arr) => {
            if(i === 0) return l
            let {position} = l,
                diff = sub(l.position, arr[i-1].position),
                dist = mag(diff)

            if(dist > 40) {
                position = add(
                    arr[i-1].position,
                    scale(normalize(diff), 40))
            }
            return {...l, position}
        })
        return {...l, links}
    })
})()

/**
 * DRAW UPDATES
 */

// draw every 16ms
looper(t => {
    c.clearRect(0,0,canvas.width,canvas.height)

    //draw links
    chains.forEach(l => {
        let {links} = l
        links.forEach((l,i,arr) => {
            let {position} = l,
                [x,y] = position
            c.fillStyle='red'
            c.fillRect(x,y,20,20)
            c.strokeStyle='blue'
            if(i > 0){
                c.beginPath()
                c.moveTo(x+10,y)
                c.lineTo(
                    arr[i-1].position[0]+10,
                    arr[i-1].position[1]+20)
                c.closePath()
                c.stroke()
            }
        })
    })
})()