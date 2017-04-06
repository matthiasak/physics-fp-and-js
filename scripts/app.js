const f = src => {
    let {origin,pathname} = window.location,
        url = `${origin}${pathname}${src}`
    console.log(url)
    return fetch(url)
        .then(r => r.text())
        .then(scriptText =>
            `https://matthiasak.github.io/arbiter-frame/#${escape(scriptText)}`)
        .catch(e => console.error(e))
}

const qs = (s='body', el=document) => el.querySelector(s)
const qsa = (s='body', el=document) => Array.prototype.slice.call(el.querySelectorAll(s))

const prep = $ => {
    qsa('iframe').map(x => x.parentElement.removeChild(x)) // clear out iframes
    const x = qsa('section')[parseInt(location.hash.substring(1)) - 1]
        , frame = qs('.iframe', x)

    if(!frame) return
    const iframe = document.createElement('iframe')
    frame.appendChild(iframe)
    f(frame.getAttribute('src')).then(src => iframe.src = src)
}

window.addEventListener('hashchange', prep)