const app = () => {
    const {obs, rAF} = clanFp
        , pipeline = obs()
        , refresh = ps => pipeline(ps)

    // game loop
    pipeline
        .debounce(16)
        .map(xs =>
             xs.map(i => i+1))
        .then(xs => {
            reset()
            log(new Date)
            log(xs)
        })
        // .then(ps => rAF($ => refresh(ps)))

    pipeline([1,2,3])
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
