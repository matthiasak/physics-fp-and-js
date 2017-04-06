const fragment = `
#ifdef GL_ES
precision mediump float;
#endif

float hash (float v) {
  return smoothstep(0.1, 0.9, abs(sin(v))) * 20.0;
}

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main(void) {
    vec2 q = gl_FragCoord.xy / resolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= resolution.x / resolution.y;

    vec3 col = vec3(0, 0.5, 1);
    vec3 c = vec3(0.0);
    c += col * (abs(tan(hash(p.x) + cos(time + p.y) + mouse.y * 0.01)));
    c += col * (abs(cos(hash(p.y) + cos(time + p.x) + mouse.x * 0.01)));
    c /= time;

    gl_FragColor = vec4(c, 1.0);
}
`

const vertex = `
attribute vec4 vPosition;
void main (void) {
    gl_Position = vPosition;
}
`

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

let canvas = document.createElement('canvas'),
    // c = canvas.getContext('2d'),
    gl = canvas.getContext('webgl')

document.body.appendChild(canvas)

const setSize = () => {
    canvas.width = document.body.offsetWidth
    canvas.height = document.body.offsetHeight
}
setSize()
window.onresize = setSize

////

let mouse = [canvas.width/2,canvas.height]

window.addEventListener('mousemove',
    ({clientX, clientY}) => mouse = [clientX, clientY])

////

let ut,
    st = Date.now(),
    um

const initShaders = (gl) => {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertex)
    gl.compileShader(vertexShader)

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragment)
    gl.compileShader(fragmentShader)

    var program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    return program;
}

const initGraphics = () => {
    gl.viewport(0, 0, canvas.width, canvas.height)

    var program = initShaders(gl)
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
    )

    var vPosition = gl.getAttribLocation(program, 'vPosition')
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)

    ut = gl.getUniformLocation(program, 'time')
    um = gl.getUniformLocation(program, 'mouse')
    var resolution = new Float32Array([canvas.width, canvas.height])
    gl.uniform2fv(gl.getUniformLocation(program, 'resolution'), resolution)
}

initGraphics()

looper(t => {
    gl.uniform1f(ut, (Date.now() - st) / 1000)
    gl.uniform2fv(um, new Float32Array(mouse))
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
})()
