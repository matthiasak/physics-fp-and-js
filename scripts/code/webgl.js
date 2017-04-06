const random = (min=-1, max=1) =>
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

////////

let canvas = document.createElement('canvas'),
    gl = canvas.getContext('webgl')

document.body.appendChild(canvas)

const setSize = () => {
    canvas.width = document.body.offsetWidth
    canvas.height = document.body.offsetHeight
}
setSize()
window.onresize = setSize

////////

const vertex = `
attribute vec3 positionAttr;
attribute vec3 colorAttr;
varying vec3 vColor;

void main(void) {
    gl_Position = vec4(positionAttr, 1.0);
    vColor = colorAttr;
}
`

const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec3 vColor;

void main(void) {
    float d = distance(mouse, gl_FragCoord.xy);
    float x = distance(vec2(0.0,0.0), resolution.xy);
    gl_FragColor = vec4(vColor.xyz + sin(time) * d/x, 0.0);
    //gl_FragColor = vec4(mouse, gl_FragCoord.x, 0.0);
}
`

////

let mouse = [0,0]

window.addEventListener('mousemove',
    ({clientX, clientY}) => mouse = [clientX,clientY])

////

let st = Date.now()
let program = (() => {
    let vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertex)
    gl.compileShader(vertexShader)
//     log(gl.getShaderInfoLog(vertexShader))

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragment)
    gl.compileShader(fragmentShader)
//     log(gl.getShaderInfoLog(fragmentShader))

    let p = gl.createProgram()
    gl.attachShader(p, vertexShader)
    gl.attachShader(p, fragmentShader)
    gl.linkProgram(p)
    gl.useProgram(p)

    // make colorAttr and positionAttr (from shaders) accessible in JS
    p.positionAttr = gl.getAttribLocation(p, "positionAttr");
    gl.enableVertexAttribArray(p.positionAttr)
    p.colorAttr = gl.getAttribLocation(p, "colorAttr")
    gl.enableVertexAttribArray(p.colorAttr)

    return p
})()

const point = () => {
    let color = Array(3).fill(1).map(_ => random(0,1)),
        p = particle()
    return {...p, color}
}

let buffer = null,
    particles = Array(3).fill(1).map(_ => point()),
    vertexData = []

const WORLD_FRICTION = 0.05
looper(t => {
    particles = particles.map(p =>
        update(p, WORLD_FRICTION))
})()

// apply random force to each particle
looper(t => {
    particles = particles.map(p =>
        applyForce(p, t, [
            random(-.5,.5),
            random(-.5,.5)
        ])
    )

    vertexData = particles.reduce((a,p) => {
        return [...a, ...p.position, 0.0, ...p.color]
    }, [])

    // interleaves particles into a flat array like:
    // [
        // Vertex 1 position
        // 0.0, 1, 0.0,
        // Vertex 1 Color
        // 1.0, 0.0, 0.0,
        // Vertex 2 position
        // -0.8, -0.8, 0.0,
        // Vertex 2 color
        // 0.0, 1.0, 0.0,
        // Vertex 3 position
        // 0.8, -.8, 0.0,
        // Vertex 3 color
        // 0.0, 0.0, 1.0
    // ]
})()

// keep the positions visible
looper(t => {
    particles = particles.map(p => {
        let {position, velocity} = p,
            [x,y] = position,
            [vx,vy] = velocity

        if(x<-1||x>1) {
            vx *= -1;
            (x < -1) && (x = -1);
            (x > 1) && (x = 1);
        }
        if(y<-1||y>1) {
            vy *= -1;
            (y < -1) && (y = -1);
            (y > 1) && (y = 1);
        }

        return {...p, position:[x,y], velocity:[vx,vy]}
    })
})()

looper(() => {
    let buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    // Interleave vertex positions and colors
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW)

    // There are 6 floating-point values per vertex
    var stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program.positionAttr,
        3, gl.FLOAT, false, stride, 0)

    // Set up color stream
    gl.vertexAttribPointer(program.colorAttr,
        3, gl.FLOAT, false, stride,
        3 * Float32Array.BYTES_PER_ELEMENT)
})()

looper(t => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform2fv(
        gl.getUniformLocation(program, 'resolution'),
        new Float32Array([canvas.width, canvas.height]))

    gl.uniform1f(
        gl.getUniformLocation(program, 'time'),
        (Date.now() - st) / 1000)

    gl.uniform2fv(
        gl.getUniformLocation(program, 'mouse'),
        new Float32Array(mouse))

    gl.drawArrays(gl.TRIANGLES, 0, 3)
})()
