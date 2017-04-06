const app = () => {
    const {obs, rAF} = clanFp
        , pipeline = obs()
        , refresh = ps => pipeline(ps)

    // game loop
    pipeline
        .debounce(16)
        .map(i => i+1)
        .then(i => {
            reset()
            log(new Date)
            log(i)
        })
        // .then(ps => rAF($ => refresh(ps)))

    pipeline(1)
}

require('clan-fp@0.0.58').then(app).catch(e => log(e+''))
